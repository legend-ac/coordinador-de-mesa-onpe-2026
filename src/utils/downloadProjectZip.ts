import JSZip from 'jszip';

// Collect all relevant files using Vite's eager raw glob
const files = import.meta.glob(
  [
    '../**/*',
    '../../index.html',
    '../../package.json',
    '../../tsconfig.json',
    '../../metadata.json',
    '../../firestore.rules',
    '../../firebase-applet-config.json',
    '../../.env.example',
  ],
  { query: '?raw', import: 'default', eager: true }
);

export async function downloadProjectZip(): Promise<void> {
  const zip = new JSZip();

  for (const [filePath, content] of Object.entries(files)) {
    // Normalize path
    let cleanPath = filePath
      .replace(/^\.\.\/\.\.\//, '')
      .replace(/^\.\.\//, 'src/');

    if (cleanPath.startsWith('src/src/')) {
      cleanPath = cleanPath.replace('src/src/', 'src/');
    }

    if (typeof content === 'string') {
      zip.file(cleanPath, content);
    }
  }

  // Also include README.md with clear instructions
  const readmeContent = `# Coordinador de Mesas ONPE - Elecciones Regionales y Municipales 2026

Sistema de control y asistencia para las Mesas 51, 52 y 53 con integración de WhatsApp oficial y base de datos Firebase Firestore.

## Cómo ejecutar localmente:
1. Instalar dependencias:
   \`\`\`bash
   npm install
   \`\`\`
2. Iniciar servidor de desarrollo:
   \`\`\`bash
   npm run dev
   \`\`\`
3. Abrir en el navegador:
   \`http://localhost:3000\`

## Identificador del Proyecto en AI Studio:
- Applet ID: \`d27dc6cf-8581-4469-8416-8ac2ac8dd93e\`
- URL en Vivo: \`https://ais-pre-arxtbgw3cgwrsgprtdclae-820404505145.us-east1.run.app\`
`;

  zip.file('README.md', readmeContent);

  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ONPE_Coordinador_Mesas_2026.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
