// whatsappService.ts — Simulação de disparo WhatsApp
// Para integrar com API real (Evolution API, Baileys, etc.), substitua os métodos abaixo.

export interface WAGroup {
  id: string;
  name: string;
  participants: number;
  isAdmin: boolean;
}

export interface WASegment {
  id: string;
  name: string;
  groupIds: string[];
  createdAt: string;
}

export interface WACampaignReport {
  id: string;
  title: string;
  thumbnailUrl?: string;
  platform: string;
  status: 'queue' | 'sending' | 'paused' | 'completed' | 'failed';
  progress: number;
  sent: number;
  failed: number;
  delayMin: number;
  delayMax: number;
  createdAt: string;
  updatedAt: string;
}

export interface WAMonitorConfig {
  monitoredSegmentId: string | null;
  autoGroupIds: string[];
}

export interface WAConnectionState {
  connected: boolean;
  phone?: string;
  name?: string;
}

const STORAGE_KEYS = {
  connection: 'wa_connection',
  groups: 'wa_groups',
  segments: 'wa_segments',
  reports: 'wa_reports',
  monitor: 'wa_monitor',
  delayMin: 'wa_delay_min',
  delayMax: 'wa_delay_max',
};

// Grupos simulados para demonstração
const MOCK_GROUPS: WAGroup[] = [
  { id: 'g1', name: 'PROMOÇÕES SHOPEE 1', participants: 120, isAdmin: true },
  { id: 'g2', name: 'PROMOÇÕES SHOPEE 2', participants: 98, isAdmin: true },
  { id: 'g3', name: 'OFERTAS AMAZON', participants: 210, isAdmin: true },
  { id: 'g4', name: 'TECH & GADGETS', participants: 77, isAdmin: false },
  { id: 'g5', name: 'MODA FEMININA VIP', participants: 154, isAdmin: true },
  { id: 'g6', name: 'INFANTIL & BEBÊ', participants: 89, isAdmin: true },
  { id: 'g7', name: 'ELETRODOMÉSTICOS', participants: 63, isAdmin: true },
  { id: 'g8', name: 'CURSOS & EBOOKS', participants: 302, isAdmin: false },
  { id: 'g9', name: 'ESPORTES & FITNESS', participants: 140, isAdmin: true },
  { id: 'g10', name: 'PETS & ANIMAIS', participants: 55, isAdmin: true },
  { id: 'g11', name: 'BELEZA & COSMÉTICOS', participants: 193, isAdmin: true },
  { id: 'g12', name: 'CASA & DECORAÇÃO', participants: 82, isAdmin: false },
];

const MOCK_REPORTS: WACampaignReport[] = [
  {
    id: 'r1',
    title: 'Olá, pessoal! 👋 Passando para um aviso imperdível...',
    platform: 'WhatsApp',
    thumbnailUrl: undefined,
    status: 'completed',
    progress: 100,
    sent: 3,
    failed: 0,
    delayMin: 1,
    delayMax: 4,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
  },
  {
    id: 'r2',
    title: '🔥 BIC Aparelho De Depilar Soleil Rosa Rox...',
    platform: 'WhatsApp',
    status: 'completed',
    progress: 100,
    sent: 7,
    failed: 0,
    delayMin: 1,
    delayMax: 4,
    createdAt: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'r3',
    title: '🌟 Colgate Spray Bucal Total 12 Spray Bucal Co...',
    platform: 'WhatsApp',
    status: 'completed',
    progress: 100,
    sent: 7,
    failed: 0,
    delayMin: 1,
    delayMax: 4,
    createdAt: new Date(Date.now() - 86400000 * 2 - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2 - 3600000).toISOString(),
  },
];

function load<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function save<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const whatsappService = {
  // --- Conexão ---
  getConnection(): WAConnectionState {
    return load<WAConnectionState>(STORAGE_KEYS.connection, { connected: false });
  },

  connect(phone: string, name: string): void {
    save(STORAGE_KEYS.connection, { connected: true, phone, name });
    // Inicializa grupos simulados na primeira conexão
    const existing = load<WAGroup[]>(STORAGE_KEYS.groups, []);
    if (existing.length === 0) {
      save(STORAGE_KEYS.groups, MOCK_GROUPS);
    }
  },

  disconnect(): void {
    save(STORAGE_KEYS.connection, { connected: false });
  },

  // --- Grupos ---
  getGroups(): WAGroup[] {
    return load<WAGroup[]>(STORAGE_KEYS.groups, []);
  },

  refreshGroups(): WAGroup[] {
    save(STORAGE_KEYS.groups, MOCK_GROUPS);
    return MOCK_GROUPS;
  },

  // --- Segmentos ---
  getSegments(): WASegment[] {
    return load<WASegment[]>(STORAGE_KEYS.segments, []);
  },

  createSegment(name: string, groupIds: string[]): WASegment {
    const segments = whatsappService.getSegments();
    const newSeg: WASegment = {
      id: `seg_${Date.now()}`,
      name,
      groupIds,
      createdAt: new Date().toISOString(),
    };
    save(STORAGE_KEYS.segments, [...segments, newSeg]);
    return newSeg;
  },

  deleteSegment(id: string): void {
    const segments = whatsappService.getSegments().filter(s => s.id !== id);
    save(STORAGE_KEYS.segments, segments);
  },

  // --- Monitor ---
  getMonitorConfig(): WAMonitorConfig {
    return load<WAMonitorConfig>(STORAGE_KEYS.monitor, {
      monitoredSegmentId: null,
      autoGroupIds: [],
    });
  },

  saveMonitorConfig(config: WAMonitorConfig): void {
    save(STORAGE_KEYS.monitor, config);
  },

  // --- Delay ---
  getDelay(): { min: number; max: number } {
    return {
      min: load<number>(STORAGE_KEYS.delayMin, 1),
      max: load<number>(STORAGE_KEYS.delayMax, 4),
    };
  },

  saveDelay(min: number, max: number): void {
    save(STORAGE_KEYS.delayMin, min);
    save(STORAGE_KEYS.delayMax, max);
  },

  // --- Relatórios ---
  getReports(): WACampaignReport[] {
    const stored = load<WACampaignReport[]>(STORAGE_KEYS.reports, []);
    if (stored.length === 0) {
      save(STORAGE_KEYS.reports, MOCK_REPORTS);
      return MOCK_REPORTS;
    }
    return stored;
  },

  addReport(report: Omit<WACampaignReport, 'id' | 'createdAt' | 'updatedAt'>): WACampaignReport {
    const reports = whatsappService.getReports();
    const newReport: WACampaignReport = {
      ...report,
      id: `rep_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    save(STORAGE_KEYS.reports, [newReport, ...reports]);
    return newReport;
  },

  clearReports(): void {
    save(STORAGE_KEYS.reports, []);
  },

  // --- Stats ---
  getStats() {
    const reports = whatsappService.getReports();
    const connection = whatsappService.getConnection();
    const segments = whatsappService.getSegments();
    const queue = reports.filter(r => r.status === 'queue').length;
    const totalSent = reports.reduce((acc, r) => acc + r.sent, 0);

    return {
      totalSent,
      totalSegments: segments.length,
      queueCount: queue,
      connected: connection.connected,
    };
  },
};
