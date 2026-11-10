export interface ExplainerLanguage {
  id: string;
  name: string;
  nativeName: string;
  gnaniCode: string;
  voiceName: string;
  model: 'timbre-v2.5' | 'timbre-v3.0';
  flag: string;
  greeting: string;
  sampleQuestion: string;
}

export const EXPLAINER_LANGUAGES: ExplainerLanguage[] = [
  {
    id: 'en',
    name: 'English',
    nativeName: 'English',
    gnaniCode: 'en-IN',
    voiceName: 'Pranav',
    model: 'timbre-v2.5',
    flag: '🇬🇧',
    greeting: 'Welcome to the CS Concept Explainer! Ask me any CS fundamentals topic—like DSA, OOPs, System Design, or Networks—and I will draw and explain it on the blackboard.',
    sampleQuestion: 'How does consistent hashing work in distributed systems?',
  },
  {
    id: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    gnaniCode: 'hi-IN',
    voiceName: 'Deepak',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'कॉन्सेप्ट एक्सप्लेनर में आपका स्वागत है! मुझसे कंप्यूटर साइंस, DSA, OOPs या सिस्टम डिज़ाइन से जुड़ा कोई भी सवाल पूछिए, मैं ब्लैकबोर्ड पर डायग्राम बनाकर समझाऊंगा।',
    sampleQuestion: 'B+ Tree और B-Tree में क्या अंतर है?',
  },
  {
    id: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    gnaniCode: 'bn-IN',
    voiceName: 'Kaveri',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'কনসেপ্ট এক্সপ্লেনারে আপনাকে স্বাগতম! কম্পিউটার সায়েন্স, DSA বা সিস্টেম ডিজাইনের যেকোনো বিষয়ে প্রশ্ন করুন, আমি ব্ল্যাকবোর্ডে ডায়াগ্রামের সাহায্যে বুঝিয়ে দেব।',
    sampleQuestion: 'TCP 3-Way Handshake কীভাবে কাজ করে?',
  },
  {
    id: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    gnaniCode: 'pa-IN',
    voiceName: 'Vikrant',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'ਕੰਸੈਪਟ ਐਕਸਪਲੇਨਰ ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ! ਕੰਪਿਊਟਰ ਸਾਇੰਸ, DSA ਜਾਂ ਸਿਸਟਮ ਡਿਜ਼ਾਈਨ ਦਾ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ, ਮੈਂ ਬਲੈਕਬੋਰਡ ਤੇ ਡਾਇਗ੍ਰਾਮ ਨਾਲ ਸਮਝਾਵਾਂਗਾ।',
    sampleQuestion: 'ਪ੍ਰੋਸੈਸ ਅਤੇ ਥ੍ਰੈਡ ਵਿੱਚ ਕੀ ਫ਼ਰਕ ਹੈ?',
  },
  {
    id: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    gnaniCode: 'gu-IN',
    voiceName: 'Jalaj',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'કન્સેપ્ટ એક્સપ્લેનરમાં આપનું સ્વાગત છે! કમ્પ્યુટર સાયન્સ, DSA અથવા સિસ્ટમ ડિઝાઇનની કોઈપણ વિભાવના પૂછો, હું બ્લેકબોર્ડ પર ડાયાગ્રામ સાથે સમજાવીશ.',
    sampleQuestion: 'ઓબ્જેક્ટ ઓરિએન્ટેડ પ્રોગ્રામિંગના મુખ્ય સિદ્ધાંતો કયા છે?',
  },
  {
    id: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    gnaniCode: 'kn-IN',
    voiceName: 'Girish',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'ಕಾನ್ಸೆಪ್ಟ್ ಎಕ್ಸ್‌ಪ್ಲೇನರ್‌ಗೆ ಸುಸ್ವಾಗತ! ಕಂಪ್ಯೂಟರ್ ಸೈನ್ಸ್, ಡಿಎಸ್ಎ ಅಥವಾ ಸಿಸ್ಟಮ್ ಡಿಸೈನ್ ಕುರಿತು ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ, ನಾನು ಬ್ಲ್ಯಾಕ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ರೇಖಾಚಿತ್ರದೊಂದಿಗೆ ವಿವರಿಸುತ್ತೇನೆ.',
    sampleQuestion: 'ಬೈನರಿ ಸರ್ಚ್ ಟ್ರೀ (BST) ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ?',
  },
  {
    id: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    gnaniCode: 'ml-IN',
    voiceName: 'Devika',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'കൺസെപ്റ്റ് എക്സ്പ്ലൈനറിലേക്ക് സ്വാഗതം! കമ്പ്യൂട്ടർ സയൻസ്, DSA അല്ലെങ്കിൽ സിസ്റ്റം ഡിസൈൻ സംശയങ്ങൾ ചോദിക്കൂ, ബ്ലാക്ക്ബോർഡിൽ ഡയഗ്രം വരച്ച് ഞാൻ വിശദീകരിക്കാം.',
    sampleQuestion: 'വർച്വൽ മെമ്മറിയും പേജിംഗും എന്താണ്?',
  },
  {
    id: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    gnaniCode: 'mr-IN',
    voiceName: 'Roopesh',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'कॉन्सेप्ट एक्सप्लेनरमध्ये आपले स्वागत आहे! कॉम्प्युटर सायन्स, DSA किंवा सिस्टीम डिझाईनशी संबंधित कोणताही प्रश्न विचारा, मी ब्लॅकबोर्डवर आकृती काढून समजावून सांगेन.',
    sampleQuestion: 'डेटा स्ट्रक्चर्समध्ये हॅशमॅप कसा काम करतो?',
  },
  {
    id: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    gnaniCode: 'ta-IN',
    voiceName: 'Asmita',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'கருத்து விளக்கத்திற்கு நல்வரவு! கணினி அறிவியல், DSA அல்லது கணினி கட்டமைப்பு தொடர்பான கேள்விகளைக் கேளுங்கள், கரும்பலகையில் வரைபடத்துடன் விளக்குகிறேன்.',
    sampleQuestion: 'OSI மாதிரியின் 7 அடுக்குகள் யாவை?',
  },
  {
    id: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    gnaniCode: 'te-IN',
    voiceName: 'Suhana',
    model: 'timbre-v2.5',
    flag: '🇮🇳',
    greeting: 'కాన్సెప్ట్ ఎక్స్‌ప్లేనర్‌కి స్వాగతం! కంప్యూటర్ సైన్స్, DSA లేదా సిస్టమ్ డిజైన్ గురించి ఏ సందేహం ఉన్నా అడగండి, నేను బ్లాక్‌బోర్డ్‌పై డయాగ్రమ్‌తో వివరిస్తాను.',
    sampleQuestion: 'డెడ్‌లాక్ (Deadlock) అంటే ఏమిటి? దాని 4 పరిస్థితులు ఏవి?',
  },
];

export function getExplainerLanguage(idOrCode?: string): ExplainerLanguage {
  if (!idOrCode) return EXPLAINER_LANGUAGES[0];
  const normalized = idOrCode.toLowerCase().trim();
  const match = EXPLAINER_LANGUAGES.find(
    (l) =>
      l.id === normalized ||
      l.gnaniCode.toLowerCase() === normalized ||
      l.name.toLowerCase() === normalized
  );
  return match || EXPLAINER_LANGUAGES[0];
}

