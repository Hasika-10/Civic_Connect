import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    home: 'Home', login: 'Login', register: 'Register', dashboard: 'Dashboard', 'report_issue': 'Report an Issue',
    complaints: 'Complaints', profile: 'Profile', settings: 'Settings', logout: 'Logout', submit: 'Submit',
    title: 'Title', description: 'Description', category: 'Category', priority: 'Priority', status: 'Status',
    resolved: 'Resolved', pending: 'Pending', 'in_progress': 'In Progress', welcome: 'Welcome',
    hero_title: 'Report. Track. Resolve.', hero_desc: 'CivicConnect empowers citizens to report public infrastructure issues and track their resolution transparently.',
  },
  ta: {
    home: 'முகப்பு', login: 'உள்நுழை', register: 'பதிவு செய்', dashboard: 'டாஷ்போர்டு', 'report_issue': 'புகார் தெரிவிக்கவும்',
    complaints: 'புகார்கள்', profile: 'சுயவிவரம்', settings: 'அமைப்புகள்', logout: 'வெளியேறு', submit: 'சமர்ப்பி',
    title: 'தலைப்பு', description: 'விளக்கம்', category: 'வகை', priority: 'முன்னுரிமை', status: 'நிலை',
    resolved: 'தீர்க்கப்பட்டது', pending: 'நிலுவையில்', 'in_progress': 'செயல்பாட்டில்', welcome: 'வரவேற்பு',
    hero_title: 'புகார். கண்காணிப்பு. தீர்வு.', hero_desc: 'CivicConnect குடிமக்களுக்கு பொது உள்கட்டமைப்பு சிக்கல்களை புகாரளிக்கவும் கண்காணிக்கவும் அதிகாரமளிக்கிறது.',
  },
  hi: {
    home: 'होम', login: 'लॉगिन', register: 'रजिस्टर', dashboard: 'डैशबोर्ड', 'report_issue': 'समस्या दर्ज करें',
    complaints: 'शिकायतें', profile: 'प्रोफ़ाइल', settings: 'सेटिंग्स', logout: 'लॉगआउट', submit: 'जमा करें',
    title: 'शीर्षक', description: 'विवरण', category: 'श्रेणी', priority: 'प्राथमिकता', status: 'स्थिति',
    resolved: 'हल किया', pending: 'लंबित', 'in_progress': 'प्रगति में', welcome: 'स्वागत',
    hero_title: 'रिपोर्ट करें। ट्रैक करें। समाधान करें।', hero_desc: 'CivicConnect नागरिकों को सार्वजनिक बुनियादी ढांचे के मुद्दों की रिपोर्ट करने और उनके समाधान को पारदर्शी रूप से ट्रैक करने का अधिकार देता है।',
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(localStorage.getItem('civicconnect_lang') || 'en');

  const t = (key) => translations[language]?.[key] || translations.en[key] || key;

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('civicconnect_lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t, changeLanguage, languages: ['en', 'ta', 'hi'] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);

