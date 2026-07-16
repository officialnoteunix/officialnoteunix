const typeStyles: Record<string, { bg: string; color: string; icon: string }> = {
  pdf: { bg: '#fee2e2', color: '#dc2626', icon: 'PDF' },
  doc: { bg: '#dbeafe', color: '#2563eb', icon: 'DOC' },
  docx: { bg: '#dbeafe', color: '#2563eb', icon: 'DOCX' },
  xls: { bg: '#dcfce7', color: '#16a34a', icon: 'XLS' },
  xlsx: { bg: '#dcfce7', color: '#16a34a', icon: 'XLSX' },
  ppt: { bg: '#ffedd5', color: '#ea580c', icon: 'PPT' },
  pptx: { bg: '#ffedd5', color: '#ea580c', icon: 'PPTX' },
  txt: { bg: '#f3f4f6', color: '#6b7280', icon: 'TXT' },
  rtf: { bg: '#ccfbf1', color: '#0d9488', icon: 'RTF' },
  odt: { bg: '#f3e8ff', color: '#9333ea', icon: 'ODT' },
  ods: { bg: '#e0e7ff', color: '#4f46e5', icon: 'ODS' },
  odp: { bg: '#fef3c7', color: '#d97706', icon: 'ODP' },
};

export default function FileTypePlaceholder({ fileType = 'pdf', height = 80 }: { fileType?: string; height?: number }) {
  const s = typeStyles[fileType.toLowerCase()] || { bg: '#f3f4f6', color: '#6b7280', icon: fileType.toUpperCase() };
  return (
    <div style={{
      width: '100%', height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: s.bg, borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
      flexDirection: 'column', gap: 2,
    }}>
      <span style={{ fontSize: Math.min(height * 0.35, 28), fontWeight: 800, color: s.color, lineHeight: 1 }}>
        {s.icon}
      </span>
      <span style={{ fontSize: 10, color: s.color, opacity: 0.7 }}>document</span>
    </div>
  );
}