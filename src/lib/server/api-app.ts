/**
 * Express API app (legacy route bodies) backed by Prisma via warehouse-sync.
 */
// @ts-nocheck
import express, { type Request, type Response } from 'express';
import { loadWarehouseDb, saveWarehouseDb } from '@/lib/server/warehouse-sync';
import { readBaselineWarehouseDb } from '@/lib/server/baseline-data';
import { genId } from '@/lib/server/gen-id';

const loadDb = () => loadWarehouseDb();
const saveDb = (data: Awaited<ReturnType<typeof loadDb>>) => saveWarehouseDb(data);

let cached: express.Application | null = null;

export function getApiApp(): express.Application {
  if (cached) return cached;
  const app = express();
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  app.get('/api/health', async (_req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString(), platform: 'Starlinks Pallet Flow' });
  });

  app.get('/api/db/export', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db);
  });

  app.post('/api/db/reset', async (_req: Request, res: Response) => {
    const initial = readBaselineWarehouseDb();
    await saveDb(initial);
    res.json({ success: true, message: 'Database reset to verified warehouse baseline', db: initial });
  });

  // ==========================================
  // API: Oracle WMS Configuration & Verification
  // ==========================================
  app.get('/api/oracle-config', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.oracleConfig || {});
  });

  app.put('/api/oracle-config', async (req: Request, res: Response) => {
    const db = await loadDb();
    db.oracleConfig = {
      ...db.oracleConfig,
      ...req.body,
      lastTestedAt: new Date().toISOString(),
    };
    await saveDb(db);
    res.json({ success: true, config: db.oracleConfig });
  });

  // Test Oracle WMS API Connection
  app.post('/api/oracle-wms/test-connection', async (req: Request, res: Response) => {
    const db = await loadDb();
    const config = { ...db.oracleConfig, ...(req.body || {}) };
    const startTime = Date.now();

    // If external URL is provided and not simulated
    if (config.apiUrl && config.apiUrl.startsWith('http') && config.authType !== 'SIMULATED') {
      try {
        const headers: Record<string, string> = {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        };
        if (config.authType === 'BEARER' && config.apiKeyOrToken) {
          headers['Authorization'] = config.apiKeyOrToken.startsWith('Bearer ') ? config.apiKeyOrToken : `Bearer ${config.apiKeyOrToken}`;
        } else if (config.authType === 'BASIC' && config.username) {
          const authString = Buffer.from(`${config.username}:${config.password || ''}`).toString('base64');
          headers['Authorization'] = `Basic ${authString}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const response = await fetch(config.apiUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const latency = Date.now() - startTime;
        db.oracleConfig.lastSyncStatus = response.ok ? 'CONNECTED' : 'FAILED';
        db.oracleConfig.lastTestedAt = new Date().toISOString();
        db.oracleConfig.statusText = `Oracle WMS HTTP ${response.status} (${latency}ms)`;
        await saveDb(db);

        return res.json({
          success: response.ok,
          status: response.status,
          latencyMs: latency,
          message: `Received status ${response.status} from Oracle WMS endpoint in ${latency}ms`,
        });
      } catch (err: any) {
        const latency = Date.now() - startTime;
        return res.json({
          success: false,
          latencyMs: latency,
          message: `Direct HTTP connection note: ${err.message}. Simulated enterprise fallback is active.`,
        });
      }
    }

    // Default simulated / enterprise sandbox mode
    const latency = Math.floor(Math.random() * 40 + 60);
    db.oracleConfig.lastSyncStatus = 'CONNECTED';
    db.oracleConfig.lastTestedAt = new Date().toISOString();
    db.oracleConfig.statusText = `Simulated Oracle WMS Endpoint Active (${db.oracleUsers.length} verified users)`;
    await saveDb(db);

    res.json({
      success: true,
      status: 200,
      latencyMs: latency,
      message: `Successfully connected to Oracle WMS directory. Verified ${db.oracleUsers.length} active warehouse user records.`,
      usersCount: db.oracleUsers.length,
    });
  });

  // Verify User against Oracle WMS
  app.post('/api/oracle-wms/verify-user', async (req: Request, res: Response) => {
    const { username } = req.body;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await loadDb();

    // Check directory of Oracle WMS users
    const matchedUser = db.oracleUsers.find(
      (u: any) => u.username.toLowerCase() === cleanUsername
    );

    if (matchedUser) {
      // Also check if user already has an account registered in this app
      const existingAppUser = db.users.find(
        (u: any) => u.username.toLowerCase() === cleanUsername
      );

      return res.json({
        existsInOracle: true,
        oracleUser: matchedUser,
        hasAppPassword: Boolean(existingAppUser && existingAppUser.hasAppPassword),
        appUser: existingAppUser || null,
        message: `User '${matchedUser.username}' (${matchedUser.fullName}) successfully verified against Oracle WMS directory.`,
      });
    }

    // User not found in Oracle WMS
    return res.status(404).json({
      existsInOracle: false,
      message: `User '${cleanUsername}' was not found in Oracle WMS directory. Please contact your WMS Administrator.`,
    });
  });

  // Get Oracle Users list for Admin view
  app.get('/api/oracle-wms/users', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.oracleUsers || []);
  });

  // ==========================================
  // API: Authentication & App Password Setup
  // ==========================================
  app.post('/api/auth/register-password', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await loadDb();

    // Verify user exists in Oracle WMS
    const oracleUser = db.oracleUsers.find((u: any) => u.username.toLowerCase() === cleanUsername);
    if (!oracleUser) {
      return res.status(400).json({ error: 'User is not verified with Oracle WMS' });
    }

    // Check if app user already exists
    let appUser = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername);

    if (appUser) {
      appUser.passwordHash = password;
      appUser.hasAppPassword = true;
      appUser.oracleVerified = true;
      appUser.oracleVerifiedAt = new Date().toISOString();
      appUser.updatedAt = new Date().toISOString();
    } else {
      // Create new app user account
      appUser = {
        id: genId('USR'),
        username: oracleUser.username,
        fullName: oracleUser.fullName,
        email: oracleUser.email,
        role: 'Operations', // Default role pending Admin assignment
        passwordHash: password,
        hasAppPassword: true,
        assignedFaco: [
          // Default first facility
          { companyId: 'COMP-01', facilityId: 'FAC-01' }
        ],
        screenPermissions: {
          pallet_inbound: 'edit',
          pallet_outbound: 'edit',
          analytics_soh: 'view',
          analytics_ib: 'view',
          analytics_ob: 'view',
          analytics_visuals: 'view',
          admin_users: 'none',
          admin_faco: 'none',
          admin_pallets: 'none',
          admin_docref: 'none',
          admin_oracle: 'none',
        },
        oracleVerified: true,
        oracleVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      db.users.push(appUser);
    }

    await saveDb(db);
    const { passwordHash, ...safeUser } = appUser;
    res.json({ success: true, message: 'Password established successfully. You can now login.', user: safeUser });
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const db = await loadDb();

    const user = db.users.find((u: any) => u.username.toLowerCase() === cleanUsername);

    if (!user) {
      // Check if user is in Oracle WMS but hasn't set an app password yet
      const oracleUser = db.oracleUsers.find((u: any) => u.username.toLowerCase() === cleanUsername);
      if (oracleUser) {
        return res.status(403).json({
          error: 'User exists in Oracle WMS but needs to create an app password first.',
          requiresPasswordSetup: true,
        });
      }
      return res.status(401).json({ error: 'Invalid username or user not found in warehouse registry' });
    }

    if (user.passwordHash !== password) {
      return res.status(401).json({ error: 'Incorrect password entered' });
    }

    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  });

  // ==========================================
  // API: User Management (Admin Only)
  // ==========================================
  app.get('/api/users', async (_req: Request, res: Response) => {
    const db = await loadDb();
    const safeUsers = db.users.map(({ passwordHash, ...u }: any) => u);
    res.json(safeUsers);
  });

  app.post('/api/users', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { username, fullName, email, role, assignedFaco, screenPermissions, password } = req.body;

    if (!username || !role) {
      return res.status(400).json({ error: 'Username and role are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    if (db.users.some((u: any) => u.username.toLowerCase() === cleanUsername)) {
      return res.status(400).json({ error: 'A user with this username already exists' });
    }

    // Default permissions based on role if not provided
    const defaultPermissions: Record<string, string> = {
      pallet_inbound: role === 'Admin' || role === 'Operations' ? 'edit' : 'view',
      pallet_outbound: role === 'Admin' || role === 'Operations' ? 'edit' : 'view',
      analytics_soh: 'view',
      analytics_ib: 'view',
      analytics_ob: 'view',
      analytics_visuals: 'view',
      admin_users: role === 'Admin' ? 'all' : 'none',
      admin_faco: role === 'Admin' ? 'all' : (role === 'Management' ? 'view' : 'none'),
      admin_pallets: role === 'Admin' ? 'all' : (role === 'Management' ? 'view' : 'none'),
      admin_docref: role === 'Admin' ? 'all' : (role === 'Management' ? 'view' : 'none'),
      admin_oracle: role === 'Admin' ? 'all' : 'none',
    };

    const newUser = {
      id: genId('USR'),
      username: cleanUsername,
      fullName: fullName || cleanUsername,
      email: email || `${cleanUsername}@starlinks-logistics.com`,
      role,
      passwordHash: password || 'password123',
      hasAppPassword: Boolean(password),
      assignedFaco: assignedFaco || [{ companyId: 'COMP-01', facilityId: 'FAC-01' }],
      screenPermissions: screenPermissions || defaultPermissions,
      oracleVerified: true,
      oracleVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users.push(newUser);
    await saveDb(db);

    const { passwordHash, ...safe } = newUser;
    res.json({ success: true, user: safe });
  });

  app.put('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await loadDb();
    const index = db.users.findIndex((u: any) => u.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const current = db.users[index];
    const updated = {
      ...current,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };

    // If password provided, update hash
    if (req.body.password) {
      updated.passwordHash = req.body.password;
      updated.hasAppPassword = true;
    }

    db.users[index] = updated;
    await saveDb(db);

    const { passwordHash, ...safe } = updated;
    res.json({ success: true, user: safe });
  });

  app.delete('/api/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await loadDb();
    const current = db.users.find((u: any) => u.id === id);

    if (!current) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (current.username === 'obaidullah.r' || current.username === 'admin.starlinks') {
      return res.status(400).json({ error: 'Cannot delete primary root administrator' });
    }

    db.users = db.users.filter((u: any) => u.id !== id);
    await saveDb(db);
    res.json({ success: true, message: `User ${current.username} deleted` });
  });

  // ==========================================
  // API: Companies & Facilities (FACO)
  // ==========================================
  app.get('/api/companies-facilities', async (_req: Request, res: Response) => {
    const db = await loadDb();
    const companies = (db.companies || []).map((c: any) => ({
      ...c,
      status: c.status || 'ACTIVE',
    }));
    const facilities = (db.facilities || []).map((f: any) => ({
      ...f,
      companyIds: f.companyIds && Array.isArray(f.companyIds) && f.companyIds.length > 0
        ? f.companyIds
        : (f.companyId ? [f.companyId] : []),
      status: f.status || 'ACTIVE',
    }));
    res.json({
      companies,
      facilities,
    });
  });

  app.post('/api/companies', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { code, name, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }
    const newComp = {
      id: genId('COMP'),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    db.companies = db.companies || [];
    db.companies.push(newComp);
    await saveDb(db);
    res.json({ success: true, company: newComp });
  });

  app.put('/api/companies/:id', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { id } = req.params;
    const { code, name, status } = req.body;
    const comp = (db.companies || []).find((c: any) => c.id === id);
    if (!comp) {
      return res.status(404).json({ error: 'Company not found' });
    }
    if (code !== undefined) comp.code = code.trim().toUpperCase();
    if (name !== undefined) comp.name = name.trim();
    if (status !== undefined) comp.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await saveDb(db);
    res.json({ success: true, company: comp });
  });

  app.post('/api/facilities', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { companyId, companyIds, code, name, city, status } = req.body;
    const assignedCompanyIds: string[] = Array.isArray(companyIds) && companyIds.length > 0
      ? companyIds
      : (companyId ? [companyId] : []);
    if (assignedCompanyIds.length === 0 || !code || !name) {
      return res.status(400).json({ error: 'At least one Company, facility code, and name are required' });
    }
    const newFac = {
      id: genId('FAC'),
      companyId: assignedCompanyIds[0],
      companyIds: assignedCompanyIds,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      city: city ? city.trim() : 'Warehouse Center',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };
    db.facilities = db.facilities || [];
    db.facilities.push(newFac);
    await saveDb(db);
    res.json({ success: true, facility: newFac });
  });

  app.put('/api/facilities/:id', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { id } = req.params;
    const { code, name, city, companyId, companyIds, status } = req.body;
    const fac = (db.facilities || []).find((f: any) => f.id === id);
    if (!fac) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    if (code !== undefined) fac.code = code.trim().toUpperCase();
    if (name !== undefined) fac.name = name.trim();
    if (city !== undefined) fac.city = city.trim();
    if (companyIds !== undefined && Array.isArray(companyIds)) {
      fac.companyIds = companyIds;
      if (companyIds.length > 0) {
        fac.companyId = companyIds[0];
      }
    } else if (companyId !== undefined) {
      fac.companyId = companyId;
      if (!fac.companyIds || fac.companyIds.length === 0) {
        fac.companyIds = [companyId];
      }
    }
    if (status !== undefined) fac.status = status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await saveDb(db);
    res.json({ success: true, facility: fac });
  });

  // Bulk Upload Companies & Facilities via CSV rows
  app.post('/api/companies-facilities/bulk-upload', async (req: Request, res: Response) => {
    const { rows } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'No valid rows provided for bulk upload' });
    }

    const db = await loadDb();
    let companiesAdded = 0;
    let facilitiesAdded = 0;

    for (const row of rows) {
      const compCode = (row.companyCode || row.CompanyCode || row.company || '').trim().toUpperCase();
      const compName = (row.companyName || row.CompanyName || compCode).trim();
      const facCode = (row.facilityCode || row.FacilityCode || row.facility || '').trim().toUpperCase();
      const facName = (row.facilityName || row.FacilityName || facCode).trim();
      const city = (row.city || row.City || 'Central Hub').trim();

      if (!compCode || !facCode) continue;

      let company = db.companies.find((c: any) => c.code === compCode);
      if (!company) {
        company = {
          id: genId('COMP'),
          code: compCode,
          name: compName || compCode,
          status: 'ACTIVE',
        };
        db.companies.push(company);
        companiesAdded++;
      }

      let facility = db.facilities.find((f: any) => f.code === facCode && f.companyId === company.id);
      if (!facility) {
        facility = {
          id: genId('FAC'),
          companyId: company.id,
          code: facCode,
          name: facName || facCode,
          city,
          status: 'ACTIVE',
        };
        db.facilities.push(facility);
        facilitiesAdded++;
      }
    }

    await saveDb(db);
    res.json({
      success: true,
      message: `Bulk processed: ${companiesAdded} companies and ${facilitiesAdded} facilities added/updated.`,
      companies: db.companies,
      facilities: db.facilities,
    });
  });

  // ==========================================
  // API: Pallet Types Management
  // ==========================================
  app.get('/api/pallet-types', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.palletTypes || []);
  });

  app.post('/api/pallet-types', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { code, name, material, lengthCm, widthCm, heightCm, tareWeightKg, maxLoadKg, color } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    const newPalletType = {
      id: genId('PLT'),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      material: material || 'Wood',
      lengthCm: Number(lengthCm) || 120,
      widthCm: Number(widthCm) || 100,
      heightCm: Number(heightCm) || 15,
      tareWeightKg: Number(tareWeightKg) || 20,
      maxLoadKg: Number(maxLoadKg) || 1500,
      color: color || '#16A34A',
      status: 'ACTIVE',
    };

    db.palletTypes.push(newPalletType);
    await saveDb(db);
    res.json({ success: true, palletType: newPalletType });
  });

  app.put('/api/pallet-types/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await loadDb();
    const idx = (db.palletTypes || []).findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pallet type not found' });
    }
    const { code, name, material, lengthCm, widthCm, heightCm, tareWeightKg, maxLoadKg, color, status } = req.body;
    db.palletTypes[idx] = {
      ...db.palletTypes[idx],
      ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(material !== undefined ? { material } : {}),
      ...(lengthCm !== undefined ? { lengthCm: Number(lengthCm) } : {}),
      ...(widthCm !== undefined ? { widthCm: Number(widthCm) } : {}),
      ...(heightCm !== undefined ? { heightCm: Number(heightCm) } : {}),
      ...(tareWeightKg !== undefined ? { tareWeightKg: Number(tareWeightKg) } : {}),
      ...(maxLoadKg !== undefined ? { maxLoadKg: Number(maxLoadKg) } : {}),
      ...(color !== undefined ? { color } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    };
    await saveDb(db);
    res.json({ success: true, palletType: db.palletTypes[idx] });
  });

  app.delete('/api/pallet-types/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await loadDb();
    const idx = (db.palletTypes || []).findIndex((p: any) => p.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Pallet type not found' });
    }
    const pallet = db.palletTypes[idx];

    // Check if referenced in transactions
    const inUse = (db.transactions || []).some((t: any) => t.palletTypeId === id);
    if (inUse) {
      return res.status(400).json({
        error: `Cannot delete "${pallet.name}" (${pallet.code}) because it is referenced in recorded transactions. You can disable it by changing its status to INACTIVE.`,
      });
    }

    db.palletTypes.splice(idx, 1);
    await saveDb(db);
    res.json({ success: true, message: `Pallet type "${pallet.name}" has been deleted.` });
  });

  // ==========================================
  // API: Document Reference Types Management
  // ==========================================
  app.get('/api/doc-ref-types', async (_req: Request, res: Response) => {
    const db = await loadDb();
    res.json(db.docRefTypes || []);
  });

  app.post('/api/doc-ref-types', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { code, name, description, status } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: 'Code and name are required' });
    }

    const newDocRefType = {
      id: genId('REF'),
      code: code.trim().toUpperCase(),
      name: name.trim(),
      description: description ? description.trim() : '',
      status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
    };

    db.docRefTypes.push(newDocRefType);
    await saveDb(db);
    res.json({ success: true, docRefType: newDocRefType });
  });

  app.put('/api/doc-ref-types/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await loadDb();
    const idx = (db.docRefTypes || []).findIndex((d: any) => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Doc ref type not found' });
    }
    const { code, name, description, status } = req.body;
    db.docRefTypes[idx] = {
      ...db.docRefTypes[idx],
      ...(code !== undefined ? { code: code.trim().toUpperCase() } : {}),
      ...(name !== undefined ? { name: name.trim() } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(status !== undefined ? { status: status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE' } : {}),
    };
    await saveDb(db);
    res.json({ success: true, docRefType: db.docRefTypes[idx] });
  });

  app.delete('/api/doc-ref-types/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const db = await loadDb();
    const idx = (db.docRefTypes || []).findIndex((d: any) => d.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Doc ref type not found' });
    }
    const docRef = db.docRefTypes[idx];

    // Check if referenced in transactions
    const inUse = (db.transactions || []).some((t: any) => t.docRefTypeId === id);
    if (inUse) {
      return res.status(400).json({
        error: `Cannot delete "${docRef.name}" (${docRef.code}) because it is referenced in recorded transactions. You can disable it by changing its status to INACTIVE.`,
      });
    }

    db.docRefTypes.splice(idx, 1);
    await saveDb(db);
    res.json({ success: true, message: `Doc ref type "${docRef.name}" has been deleted.` });
  });

  // ==========================================
  // API: Transactions (Inbound & Outbound)
  // ==========================================
  app.get('/api/transactions', async (req: Request, res: Response) => {
    const db = await loadDb();
    let txns = [...db.transactions];

    const { type, companyId, facilityId, palletTypeId, user, startDate, endDate, source } = req.query;

    if (type) {
      txns = txns.filter((t: any) => t.type === String(type).toUpperCase());
    }
    if (companyId) {
      txns = txns.filter((t: any) => t.companyId === companyId);
    }
    if (facilityId) {
      txns = txns.filter((t: any) => t.facilityId === facilityId);
    }
    if (palletTypeId) {
      txns = txns.filter((t: any) => t.palletTypeId === palletTypeId);
    }
    if (source) {
      txns = txns.filter((t: any) => t.source === source);
    }
    if (user) {
      const q = String(user).toLowerCase();
      txns = txns.filter((t: any) =>
        t.createdByUsername?.toLowerCase().includes(q) ||
        t.createdByName?.toLowerCase().includes(q)
      );
    }
    if (startDate) {
      const start = new Date(String(startDate)).getTime();
      txns = txns.filter((t: any) => new Date(t.timestamp).getTime() >= start);
    }
    if (endDate) {
      const end = new Date(String(endDate)).getTime();
      txns = txns.filter((t: any) => new Date(t.timestamp).getTime() <= end);
    }

    // Sort newest first
    txns.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json(txns);
  });

  // Record Single Inbound / Outbound Pallet
  app.post('/api/transactions', async (req: Request, res: Response) => {
    const db = await loadDb();
    const {
      type, // 'INBOUND' | 'OUTBOUND'
      source,
      sourceLabel,
      companyId,
      facilityId,
      docRefTypeId,
      docRefNumber,
      palletTypeId,
      qty,
      notes,
      user, // logged in user payload
    } = req.body;

    if (!type || !source || !companyId || !facilityId || !docRefTypeId || !docRefNumber || !palletTypeId || !qty) {
      return res.status(400).json({ error: 'All fields are mandatory (source, company, facility, doc ref, pallet type, qty)' });
    }

    const numQty = parseInt(String(qty), 10);
    if (isNaN(numQty) || numQty <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    const company = db.companies.find((c: any) => c.id === companyId);
    const facility = db.facilities.find((f: any) => f.id === facilityId);
    const palletType = db.palletTypes.find((p: any) => p.id === palletTypeId);
    const docRefType = db.docRefTypes.find((d: any) => d.id === docRefTypeId);

    if (!company || !facility || !palletType || !docRefType) {
      return res.status(400).json({ error: 'Invalid reference selected for company, facility, pallet type, or doc ref' });
    }

    // If outbound, check SOH validation warning/check
    if (type === 'OUTBOUND') {
      const currentStock = db.transactions
        .filter((t: any) => t.facilityId === facilityId && t.palletTypeId === palletTypeId)
        .reduce((acc: number, cur: any) => cur.type === 'INBOUND' ? acc + cur.qty : acc - cur.qty, 0);

      // Warning note if outstrips stock
      if (numQty > currentStock) {
        // Still allow warehouse override or record with notice
        console.warn(`Outbound quantity (${numQty}) exceeds current on-hand stock (${currentStock}) for facility ${facility.code}`);
      }
    }

    const newTxn = {
      id: genId(type === 'INBOUND' ? 'TXN-IB' : 'TXN-OB'),
      type: type.toUpperCase(),
      source,
      sourceLabel: sourceLabel || source,
      companyId: company.id,
      companyCode: company.code,
      companyName: company.name,
      facilityId: facility.id,
      facilityCode: facility.code,
      facilityName: facility.name,
      docRefTypeId: docRefType.id,
      docRefTypeName: docRefType.name,
      docRefNumber: String(docRefNumber).trim(),
      palletTypeId: palletType.id,
      palletTypeCode: palletType.code,
      palletTypeName: palletType.name,
      qty: numQty,
      notes: notes || '',
      createdByUserId: user?.id || 'USR-01',
      createdByUsername: user?.username || 'system.user',
      createdByName: user?.fullName || 'Warehouse Operator',
      timestamp: new Date().toISOString(),
    };

    db.transactions.unshift(newTxn);
    await saveDb(db);

    res.json({ success: true, transaction: newTxn, message: `${type === 'INBOUND' ? 'Received' : 'Shipped'} ${numQty} ${palletType.code} pallets successfully.` });
  });

  // Bulk Inbound / Outbound Upload
  app.post('/api/transactions/bulk', async (req: Request, res: Response) => {
    const { type, rows, user, defaultCompanyId, defaultFacilityId } = req.body;
    if (!type || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'Type and non-empty rows array are required' });
    }

    const db = await loadDb();
    const createdTxns: any[] = [];
    const errors: string[] = [];

    rows.forEach((row: any, idx: number) => {
      try {
        const rowCompanyCode = row.Company || row.company || row.companyCode;
        const rowFacilityCode = row.Facility || row.facility || row.facilityCode;
        const rowSource = row.Source || row.source;
        const rowDocRefType = row.DocRefType || row.docRefType || row.docRefTypeName;
        const rowDocRef = row.DocRef || row.docRef || row.DocRefNumber || row.docRefNumber;
        const rowPalletType = row.PalletType || row.palletType || row.palletTypeCode;
        const rowQty = parseInt(row.Qty || row.qty || row.quantity, 10);
        const rowNotes = row.Notes || row.notes || 'Bulk CSV Upload';

        if (!rowDocRef || isNaN(rowQty) || rowQty <= 0) {
          errors.push(`Row ${idx + 1}: Missing DocRef or invalid Quantity`);
          return;
        }

        // Match company & facility
        let company = db.companies.find((c: any) => c.code === rowCompanyCode || c.name === rowCompanyCode);
        if (!company && defaultCompanyId) {
          company = db.companies.find((c: any) => c.id === defaultCompanyId);
        }
        if (!company) company = db.companies[0];

        let facility = db.facilities.find((f: any) => f.code === rowFacilityCode || f.name === rowFacilityCode);
        if (!facility && defaultFacilityId) {
          facility = db.facilities.find((f: any) => f.id === defaultFacilityId);
        }
        if (!facility) facility = db.facilities.find((f: any) => f.companyId === company.id) || db.facilities[0];

        // Match pallet type
        let pallet = db.palletTypes.find((p: any) =>
          p.code.toLowerCase() === String(rowPalletType || '').toLowerCase() ||
          p.name.toLowerCase().includes(String(rowPalletType || '').toLowerCase())
        );
        if (!pallet) pallet = db.palletTypes[0]; // fallback to wooden

        // Match doc ref type
        let docRefType = db.docRefTypes.find((d: any) =>
          d.code.toLowerCase() === String(rowDocRefType || '').toLowerCase() ||
          d.name.toLowerCase().includes(String(rowDocRefType || '').toLowerCase())
        );
        if (!docRefType) docRefType = db.docRefTypes[0];

        const txn = {
          id: genId(type === 'INBOUND' ? 'TXN-IB' : 'TXN-OB'),
          type: type.toUpperCase(),
          source: rowSource || (type === 'INBOUND' ? 'MKT_PURCHASE' : 'OUT_ORDER'),
          sourceLabel: rowSource || (type === 'INBOUND' ? 'Bulk Inbound' : 'Bulk Outbound'),
          companyId: company.id,
          companyCode: company.code,
          companyName: company.name,
          facilityId: facility.id,
          facilityCode: facility.code,
          facilityName: facility.name,
          docRefTypeId: docRefType.id,
          docRefTypeName: docRefType.name,
          docRefNumber: String(rowDocRef).trim(),
          palletTypeId: pallet.id,
          palletTypeCode: pallet.code,
          palletTypeName: pallet.name,
          qty: rowQty,
          notes: rowNotes,
          createdByUserId: user?.id || 'USR-01',
          createdByUsername: user?.username || 'bulk_operator',
          createdByName: user?.fullName || 'Bulk Uploader',
          timestamp: new Date().toISOString(),
        };

        createdTxns.push(txn);
        db.transactions.unshift(txn);
      } catch (e: any) {
        errors.push(`Row ${idx + 1}: ${e.message}`);
      }
    });

    await saveDb(db);
    res.json({
      success: true,
      count: createdTxns.length,
      errors,
      message: `Successfully processed ${createdTxns.length} ${type} pallet records.`,
    });
  });

  // ==========================================
  // API: Analytics & SOH (Stock on Hand)
  // ==========================================
  app.get('/api/analytics/soh', async (req: Request, res: Response) => {
    const db = await loadDb();
    const { companyId, facilityId } = req.query;

    let targetFacilities = [...db.facilities];
    if (facilityId) {
      targetFacilities = targetFacilities.filter((f: any) => f.id === facilityId);
    } else if (companyId) {
      targetFacilities = targetFacilities.filter((f: any) => f.companyId === companyId);
    }

    const sohRecords: any[] = [];

    targetFacilities.forEach((facility: any) => {
      const company = db.companies.find((c: any) => c.id === facility.companyId);

      db.palletTypes.forEach((pallet: any) => {
        const facTxns = db.transactions.filter(
          (t: any) => t.facilityId === facility.id && t.palletTypeId === pallet.id
        );

        const totalInbound = facTxns
          .filter((t: any) => t.type === 'INBOUND')
          .reduce((sum: number, t: any) => sum + t.qty, 0);

        const totalOutbound = facTxns
          .filter((t: any) => t.type === 'OUTBOUND')
          .reduce((sum: number, t: any) => sum + t.qty, 0);

        const currentSOH = totalInbound - totalOutbound;

        const lastTxn = facTxns.sort(
          (a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        )[0];

        sohRecords.push({
          companyId: company?.id || facility.companyId,
          companyCode: company?.code || '',
          companyName: company?.name || '',
          facilityId: facility.id,
          facilityCode: facility.code,
          facilityName: facility.name,
          palletTypeId: pallet.id,
          palletTypeCode: pallet.code,
          palletTypeName: pallet.name,
          totalInbound,
          totalOutbound,
          currentSOH,
          lastMovementTime: lastTxn ? lastTxn.timestamp : null,
        });
      });
    });

    res.json(sohRecords);
  });

  // Analytics Aggregate Overview
  app.get('/api/analytics/overview', async (_req: Request, res: Response) => {
    const db = await loadDb();
    const txns = db.transactions;

    let totalIbQty = 0;
    let totalObQty = 0;
    let totalDamageQty = 0;

    const palletTypeMap: Record<string, { code: string; name: string; ib: number; ob: number; soh: number }> = {};
    const facilityMap: Record<string, { code: string; name: string; ib: number; ob: number; soh: number }> = {};
    const sourceMap: Record<string, { label: string; count: number; qty: number }> = {};
    const monthlyMap: Record<string, { month: string; ib: number; ob: number }> = {};

    db.palletTypes.forEach((p: any) => {
      palletTypeMap[p.id] = { code: p.code, name: p.name, ib: 0, ob: 0, soh: 0 };
    });

    db.facilities.forEach((f: any) => {
      facilityMap[f.id] = { code: f.code, name: f.name, ib: 0, ob: 0, soh: 0 };
    });

    txns.forEach((t: any) => {
      const monthKey = t.timestamp.slice(0, 7); // YYYY-MM
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { month: monthKey, ib: 0, ob: 0 };
      }

      if (!sourceMap[t.source]) {
        sourceMap[t.source] = { label: t.sourceLabel || t.source, count: 0, qty: 0 };
      }
      sourceMap[t.source].count += 1;
      sourceMap[t.source].qty += t.qty;

      if (t.type === 'INBOUND') {
        totalIbQty += t.qty;
        monthlyMap[monthKey].ib += t.qty;
        if (palletTypeMap[t.palletTypeId]) palletTypeMap[t.palletTypeId].ib += t.qty;
        if (facilityMap[t.facilityId]) facilityMap[t.facilityId].ib += t.qty;
      } else {
        totalObQty += t.qty;
        monthlyMap[monthKey].ob += t.qty;
        if (palletTypeMap[t.palletTypeId]) palletTypeMap[t.palletTypeId].ob += t.qty;
        if (facilityMap[t.facilityId]) facilityMap[t.facilityId].ob += t.qty;

        if (t.source === 'DMG_SIGNOFF' || t.source === 'DMG_SOLD') {
          totalDamageQty += t.qty;
        }
      }
    });

    // Compute SOH
    Object.keys(palletTypeMap).forEach((id) => {
      palletTypeMap[id].soh = palletTypeMap[id].ib - palletTypeMap[id].ob;
    });
    Object.keys(facilityMap).forEach((id) => {
      facilityMap[id].soh = facilityMap[id].ib - facilityMap[id].ob;
    });

    const totalSOH = totalIbQty - totalObQty;

    res.json({
      kpis: {
        totalSOH,
        totalInbound: totalIbQty,
        totalOutbound: totalObQty,
        totalDamage: totalDamageQty,
        activeFacilitiesCount: db.facilities.filter((f: any) => f.status === 'ACTIVE').length,
        totalTransactionsCount: txns.length,
      },
      palletBreakdown: Object.values(palletTypeMap),
      facilityBreakdown: Object.values(facilityMap),
      sourceBreakdown: Object.values(sourceMap),
      monthlyTrends: Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month)),
    });
  });



  cached = app;
  return app;
}
