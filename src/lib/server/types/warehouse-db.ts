export type WarehouseDb = {
  oracleConfig: Record<string, unknown>;
  oracleUsers: Array<Record<string, unknown>>;
  companies: Array<Record<string, unknown>>;
  facilities: Array<Record<string, unknown>>;
  palletTypes: Array<Record<string, unknown>>;
  docRefTypes: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
  transactions: Array<Record<string, unknown>>;
};
