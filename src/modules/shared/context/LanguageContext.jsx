import React, { createContext, useContext, useState, useEffect } from 'react';

// Translation strings
const translations = {
  en: {
    // Common
    dashboard: 'Dashboard',
    home: 'Home',
    profile: 'Profile',
    logout: 'Logout',
    settings: 'Settings',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    welcome: 'Welcome',
    back: 'Back',
    next: 'Next',
    search: 'Search',
    filter: 'Filter',
    all: 'All',
    active: 'Active',
    completed: 'Completed',
    pending: 'Pending',
    
    // Navigation
    trips: 'Trips',
    catch: 'Catch',
    crew: 'Crew',
    expenses: 'Expenses',
    history: 'History',
    reports: 'Reports',
    
    // Fisher Dashboard
    fisherDashboard: 'Fisher Dashboard',
    myTrips: 'My Trips',
    tripHistory: 'Trip History',
    earnings: 'Earnings',
    totalEarnings: 'Total Earnings',
    pendingPayments: 'Pending Payments',
    completedTrips: 'Completed Trips',
    activeTrips: 'Active Trips',
    noTripsFound: 'No trips found',
    viewDetails: 'View Details',
    
    // Captain Dashboard
    captainDashboard: 'Captain Dashboard',
    startTrip: 'Start Trip',
    endTrip: 'End Trip',
    addCatch: 'Add Catch',
    manageCrew: 'Manage Crew',
    tripSummary: 'Trip Summary',
    currentTrip: 'Current Trip',
    noActiveTrip: 'No Active Trip',
    startNewTrip: 'Start New Trip',
    vesselName: 'Vessel Name',
    departurePort: 'Departure Port',
    fishingMethod: 'Fishing Method',
    crewCount: 'Crew Count',
    departureDate: 'Departure Date',
    returnDate: 'Return Date',
    
    // Vessel Owner Dashboard
    vesselOwnerDashboard: 'Vessel Owner Dashboard',
    myVessels: 'My Vessels',
    vesselDetails: 'Vessel Details',
    vesselStatus: 'Vessel Status',
    registrationNumber: 'Registration Number',
    
    // Catch Entry
    speciesName: 'Species Name',
    weight: 'Weight',
    quantity: 'Quantity',
    kg: 'kg',
    pricePerKg: 'Price per Kg',
    totalWeight: 'Total Weight',
    totalValue: 'Total Value',
    addSpecies: 'Add Species',
    selectSpecies: 'Select Species',
    
    // Crew
    crewMembers: 'Crew Members',
    addCrewMember: 'Add Crew Member',
    fisherName: 'Fisher Name',
    role: 'Role',
    share: 'Share',
    scanQR: 'Scan QR',
    
    // Expenses
    tripExpenses: 'Trip Expenses',
    fuel: 'Fuel',
    ice: 'Ice',
    food: 'Food',
    maintenance: 'Maintenance',
    other: 'Other',
    liters: 'Liters',
    amount: 'Amount',
    
    // Quality
    freshness: 'Freshness',
    quality: 'Quality',
    excellent: 'Excellent',
    good: 'Good',
    fair: 'Fair',
    poor: 'Poor',
    
    // Login
    login: 'Login',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    mobileNumber: 'Mobile Number',
    enterOtp: 'Enter OTP',
    sendOtp: 'Send OTP',
    verifyOtp: 'Verify OTP',
    
    // Messages
    tripStarted: 'Trip started successfully',
    tripEnded: 'Trip ended successfully',
    catchAdded: 'Catch added successfully',
    crewAdded: 'Crew member added',
    expenseSaved: 'Expense saved',
    
    // Date/Time
    today: 'Today',
    yesterday: 'Yesterday',
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    
    // Units
    rupees: '₹',
    kilograms: 'Kilograms',
    
    // Language
    language: 'Language',
    english: 'English',
    tamil: 'தமிழ்',
    
    // Fisher Identity Card
    fisherIdCard: 'Fisher Identity Card',
    verified: 'VERIFIED',
    blueosNetwork: 'BlueOS Network',
    generating: 'Generating...',
    fathersName: "Father's Name",
    emergencyContact: 'Emergency Contact',
    refresh: 'Refresh',
    noTripsYet: 'No trips recorded yet',
    tripNumber: 'Trip Number',
    vessel: 'Vessel',
    date: 'Date',
    status: 'Status',
    
    // Login Page
    wildFishery: 'Wild Fishery',
    staffLogin: 'Staff Login',
    fisher: 'Fisher',
    forAdminCaptain: 'For Admin, Captain, Worker & Inspector',
    mobileNumberLabel: 'Mobile Number',
    enterMobileNumber: 'Enter mobile number',
    otpLabel: 'OTP',
    enterOtpPlaceholder: 'Enter OTP (1234)',
    processing: 'Processing...',
    loginButton: 'Login',
    enterUsername: 'Enter username',
    enterPassword: 'Enter password',
    signingIn: 'Signing In...',
    signIn: 'Sign In',
    vesselOwnerQuestion: 'Vessel Owner?',
    
    // Vessel Owner
    vesselOwnerLogin: 'Vessel Owner Login',
    dontHaveAccount: "Don't have an account?",
    registerAsVesselOwner: 'Register as Vessel Owner',
    
    // Common UI
    clearSessionData: 'Clear Session Data',
    rating: 'Rating',
    loadingTrips: 'Loading trips...',
    noTripsMessage: 'When a captain adds you to a trip, it will appear here.',
    port: 'Port',
    method: 'Method',
    departure: 'Dep',
    joined: 'Joined',
    
    // Fisher Registration
    fisherRegistration: 'Fisher Registration',
    fullName: 'Full Name',
    homePort: 'Home Port',
    permanentAddress: 'Permanent Address',
    emergencyContactSection: 'Emergency Contact',
    contactName: 'Contact Name',
    contactNumber: 'Contact Number',
    creatingProfile: 'Creating Profile...',
    createProfile: 'Create Profile',
    registrationError: 'Registration failed',
    networkError: 'Network error during registration. Please check console.',
    
    // Vessel Owner Registration - New Keys Only
    vesselOwnerRegistration: 'Vessel Owner Registration',
    registerVesselAndAccount: 'Register your vessel and create your account',
    ownerDetails: 'Owner Details',
    accountCredentials: 'Account Credentials',
    tenDigitMobile: '10 digit mobile number',
    emailOptional: 'Email (Optional)',
    aadhaarNumber: 'Aadhaar Number',
    panNumber: 'PAN Number',
    imnNumber: 'IMN Number',
    usernamePlaceholder: 'Choose a username (min 4 characters)',
    passwordPlaceholder: 'Min 6 characters, 1 uppercase, 1 number',
    confirmPasswordPlaceholder: 'Re-enter password',
    submitRegistration: 'Submit Registration',
    submitting: 'Submitting',
    agreeToTerms: 'I agree to the Terms & Conditions',
    noteLabel: 'Note',
    registrationNote: 'Your registration will be reviewed by an administrator. You will be notified once your account is approved.',
    enterVesselName: 'Please enter vessel name',
    enterRegistrationNumber: 'Please enter vessel registration number',
    selectHomePort: 'Please select home port',
  },
  
  ta: {
    // Common
    dashboard: 'டாஷ்போர்டு',
    home: 'முகப்பு',
    profile: 'சுயவிவரம்',
    logout: 'வெளியேறு',
    settings: 'அமைப்புகள்',
    save: 'சேமி',
    cancel: 'ரத்து செய்',
    submit: 'சமர்ப்பி',
    loading: 'ஏற்றுகிறது...',
    success: 'வெற்றி',
    error: 'பிழை',
    welcome: 'வரவேற்கிறோம்',
    back: 'பின்செல்',
    next: 'அடுத்து',
    search: 'தேடு',
    filter: 'வடிகட்டு',
    all: 'அனைத்தும்',
    active: 'செயலில்',
    completed: 'முடிந்தது',
    pending: 'நிலுவையில்',
    
    // Navigation
    trips: 'பயணங்கள்',
    catch: 'பிடிப்பு',
    crew: 'குழு',
    expenses: 'செலவுகள்',
    history: 'வரலாறு',
    reports: 'அறிக்கைகள்',
    
    // Fisher Dashboard
    fisherDashboard: 'மீனவர் டாஷ்போர்டு',
    myTrips: 'என் பயணங்கள்',
    tripHistory: 'பயண வரலாறு',
    earnings: 'வருமானம்',
    totalEarnings: 'மொத்த வருமானம்',
    pendingPayments: 'நிலுவை தொகை',
    completedTrips: 'முடிந்த பயணங்கள்',
    activeTrips: 'செயலில் உள்ள பயணங்கள்',
    noTripsFound: 'பயணங்கள் இல்லை',
    viewDetails: 'விவரங்களைக் காண்க',
    
    // Captain Dashboard
    captainDashboard: 'கேப்டன் டாஷ்போர்டு',
    startTrip: 'பயணத்தைத் தொடங்கு',
    endTrip: 'பயணத்தை முடி',
    addCatch: 'பிடிப்பைச் சேர்',
    manageCrew: 'குழுவை நிர்வகி',
    tripSummary: 'பயண சுருக்கம்',
    currentTrip: 'தற்போதைய பயணம்',
    noActiveTrip: 'செயலில் உள்ள பயணம் இல்லை',
    startNewTrip: 'புதிய பயணம் தொடங்கு',
    vesselName: 'படகின் பெயர்',
    departurePort: 'புறப்படும் துறைமுகம்',
    fishingMethod: 'மீன்பிடி முறை',
    crewCount: 'குழு எண்ணிக்கை',
    departureDate: 'புறப்படும் தேதி',
    returnDate: 'திரும்பும் தேதி',
    
    // Vessel Owner Dashboard
    vesselOwnerDashboard: 'படகு உரிமையாளர் டாஷ்போர்டு',
    myVessels: 'என் படகுகள்',
    vesselDetails: 'படகு விவரங்கள்',
    vesselStatus: 'படகு நிலை',
    registrationNumber: 'பதிவு எண்',
    
    // Catch Entry
    speciesName: 'மீன் வகை',
    weight: 'எடை',
    quantity: 'அளவு',
    kg: 'கி.கி',
    pricePerKg: 'கி.கி விலை',
    totalWeight: 'மொத்த எடை',
    totalValue: 'மொத்த மதிப்பு',
    addSpecies: 'மீன் வகை சேர்',
    selectSpecies: 'மீன் வகை தேர்வு',
    
    // Crew
    crewMembers: 'குழு உறுப்பினர்கள்',
    addCrewMember: 'குழு உறுப்பினர் சேர்',
    fisherName: 'மீனவர் பெயர்',
    role: 'பணி',
    share: 'பங்கு',
    scanQR: 'QR ஸ்கேன்',
    
    // Expenses
    tripExpenses: 'பயண செலவுகள்',
    fuel: 'எரிபொருள்',
    ice: 'பனிக்கட்டி',
    food: 'உணவு',
    maintenance: 'பராமரிப்பு',
    other: 'மற்றவை',
    liters: 'லிட்டர்',
    amount: 'தொகை',
    
    // Quality
    freshness: 'புத்துணர்வு',
    quality: 'தரம்',
    excellent: 'சிறந்த',
    good: 'நல்ல',
    fair: 'சுமாரான',
    poor: 'மோசமான',
    
    // Login
    login: 'உள்நுழை',
    register: 'பதிவு செய்',
    username: 'பயனர் பெயர்',
    password: 'கடவுச்சொல்',
    mobileNumber: 'கைபேசி எண்',
    enterOtp: 'OTP உள்ளிடவும்',
    sendOtp: 'OTP அனுப்பு',
    verifyOtp: 'OTP சரிபார்',
    
    // Messages
    tripStarted: 'பயணம் வெற்றிகரமாக தொடங்கியது',
    tripEnded: 'பயணம் வெற்றிகரமாக முடிந்தது',
    catchAdded: 'பிடிப்பு வெற்றிகரமாக சேர்க்கப்பட்டது',
    crewAdded: 'குழு உறுப்பினர் சேர்க்கப்பட்டார்',
    expenseSaved: 'செலவு சேமிக்கப்பட்டது',
    
    // Date/Time
    today: 'இன்று',
    yesterday: 'நேற்று',
    thisWeek: 'இந்த வாரம்',
    thisMonth: 'இந்த மாதம்',
    
    // Units
    rupees: '₹',
    kilograms: 'கிலோகிராம்',
    
    // Language
    language: 'மொழி',
    english: 'English',
    tamil: 'தமிழ்',
    
    // Fisher Identity Card
    fisherIdCard: 'மீனவர் அடையாள அட்டை',
    verified: 'சரிபார்க்கப்பட்டது',
    blueosNetwork: 'BlueOS நெட்வொர்க்',
    generating: 'உருவாக்குகிறது...',
    fathersName: 'தந்தை பெயர்',
    emergencyContact: 'அவசர தொடர்பு',
    refresh: 'புதுப்பி',
    noTripsYet: 'இன்னும் பயணங்கள் இல்லை',
    tripNumber: 'பயண எண்',
    vessel: 'படகு',
    date: 'தேதி',
    status: 'நிலை',
    
    // Login Page
    wildFishery: 'காட்டு மீன்பிடித்தல்',
    staffLogin: 'ஊழியர் உள்நுழைவு',
    fisher: 'மீனவர்',
    forAdminCaptain: 'நிர்வாகி, தலைவர், தொழிலாளர் & ஆய்வாளர்',
    mobileNumberLabel: 'கைபேசி எண்',
    enterMobileNumber: 'கைபேசி எண்ணை உள்ளிடவும்',
    otpLabel: 'OTP',
    enterOtpPlaceholder: 'OTP உள்ளிடவும் (1234)',
    processing: 'செயலாக்குகிறது...',
    loginButton: 'உள்நுழை',
    enterUsername: 'பயனர் பெயரை உள்ளிடவும்',
    enterPassword: 'கடவுச்சொல்லை உள்ளிடவும்',
    signingIn: 'உள்நுழைகிறது...',
    signIn: 'உள்நுழை',
    vesselOwnerQuestion: 'படகு உரிமையாளரா?',
    
    // Vessel Owner
    vesselOwnerLogin: 'படகு உரிமையாளர் உள்நுழைவு',
    dontHaveAccount: 'கணக்கு இல்லையா?',
    registerAsVesselOwner: 'படகு உரிமையாளராக பதிவு செய்',
    
    // Common UI
    clearSessionData: 'அமர்வு தரவை அழி',
    rating: 'மதிப்பீடு',
    loadingTrips: 'பயணங்கள் ஏற்றப்படுகிறது...',
    noTripsMessage: 'ஒரு தலைவர் உங்களை பயணத்தில் சேர்க்கும்போது, அது இங்கே தோன்றும்.',
    port: 'துறைமுகம்',
    method: 'முறை',
    departure: 'புறப்பட்டது',
    joined: 'சேர்ந்தது',
    
    // Fisher Registration
    fisherRegistration: 'மீனவர் பதிவு',
    fullName: 'முழு பெயர்',
    homePort: 'வீட்டு துறைமுகம்',
    permanentAddress: 'நிரந்தர முகவரி',
    emergencyContactSection: 'அவசர தொடர்பு',
    contactName: 'தொடர்பு பெயர்',
    contactNumber: 'தொடர்பு எண்',
    creatingProfile: 'சுயவிவரம் உருவாக்குகிறது...',
    createProfile: 'சுயவிவரம் உருவாக்கு',
    registrationError: 'பதிவு தோல்வியுற்றது',
    networkError: 'பதிவின் போது நெட்வொர்க் பிழை. தயவுசெய்து கன்சோல் சரிபார்க்கவும்.',
    
    // Vessel Owner Registration - New Keys Only
    vesselOwnerRegistration: 'படகு உரிமையாளர் பதிவு',
    registerVesselAndAccount: 'உங்கள் படகைப் பதிவு செய்து உங்கள் கணக்கை உருவாக்கவும்',
    ownerDetails: 'உரிமையாளர் விவரங்கள்',
    accountCredentials: 'கணக்கு நம்பிக்கை',
    tenDigitMobile: '10 இலக்க மொபைல் எண்',
    emailOptional: 'ஈமெயில் (விருப்பமாக)',
    aadhaarNumber: 'ஆதார் எண்',
    panNumber: 'PAN எண்',
    imnNumber: 'IMN எண்',
    usernamePlaceholder: 'பயனர் பெயர் தேர்ந்தெடுக்கவும் (குறைந்தது 4 எழுத்து)',
    passwordPlaceholder: 'குறைந்தது 6 எழுத்து, 1 பெரிய எழுத்து, 1 எண்',
    confirmPasswordPlaceholder: 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்',
    submitRegistration: 'பதிவை சமர்ப்பி',
    submitting: 'சமர்ப்பிக்கிறது',
    agreeToTerms: 'நான் விதிமுறைகள் மற்றும் நிபந்தனைகளுக்கு ஒப்புக்கொள்கிறேன்',
    noteLabel: 'குறிப்பு',
    registrationNote: 'உங்கள் பதிவு நிர்வாகி மூலம் மீதிபாக்கம் செய்யப்படும். உங்கள் கணக்கு அங்கீகாரம் கிடைக்கும் போது உங்களுக்கு அறிவிக்கப்படும்.',
    enterVesselName: 'தயவுசெய்து படகு பெயர் உள்ளிடவும்',
    enterRegistrationNumber: 'தயவுசெய்து பதிவு எண் உள்ளிடவும்',
    selectHomePort: 'தயவுசெய்து வீட்டு துறைமுகம் தேர்ந்தெடுக்கவும்',
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Get saved language from localStorage or default to English
    const saved = localStorage.getItem('blueos-language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('blueos-language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ta' : 'en');
  };

  const t = (key) => {
    return translations[language][key] || translations['en'][key] || key;
  };

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    t,
    isEnglish: language === 'en',
    isTamil: language === 'ta'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
