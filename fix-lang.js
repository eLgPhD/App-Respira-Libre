import fs from 'fs';

const files = [
  'src/App.tsx',
  'src/components/Form.tsx',
  'src/components/Auth.tsx',
  'src/components/Dashboard.tsx',
  'src/services/geminiService.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Replace t(language, 'key') with t('key')
  content = content.replace(/t\(language,\s*/g, 't(');
  
  // Remove language={language}
  content = content.replace(/\s*language=\{language\}/g, '');
  
  // Remove language: Language; from props
  content = content.replace(/\s*language:\s*Language;/g, '');
  
  // Remove language from component signatures
  content = content.replace(/,\s*language\s*\}\s*:\s*FormProps/g, '} : FormProps');
  content = content.replace(/,\s*language\s*\}\s*:\s*AuthProps/g, '} : AuthProps');
  content = content.replace(/,\s*language\s*\}\s*:\s*DashboardProps/g, '} : DashboardProps');
  
  // Remove language from generateQuitPlan signature
  content = content.replace(/,\s*language:\s*string\s*=\s*'es'/g, '');
  content = content.replace(/,\s*language/g, '');
  
  // Replace ternary language checks with Spanish string
  content = content.replace(/language === 'es' \? '([^']+)' : language === 'fr' \? '[^']+' : '[^']+'/g, "'$1'");
  content = content.replace(/language === 'es' \? "([^"]+)" : language === 'fr' \? "[^"]+" : "[^"]+"/g, '"$1"');
  
  // Specific replacements for Dashboard DateFormat
  content = content.replace(/language === 'es' \? 'es-ES' : language === 'fr' \? 'fr-FR' : 'en-US'/g, "'es-ES'");
  
  // Replace VapeOff with Respira Libre
  content = content.replace(/VapeOff/g, 'Respira Libre');
  
  fs.writeFileSync(file, content);
});
console.log('Done');
