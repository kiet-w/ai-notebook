export type Locale = 'vi' | 'en';

export interface CommonTranslations {
  save: string;
  cancel: string;
  close: string;
  delete: string;
  edit: string;
  loading: string;
  error: string;
  retry: string;
  success: string;
  back: string;
  or: string;
  confirm: string;
  search: string;
  copied: string;
  copy: string;
  share: string;
  empty: string;
  refresh: string;
  document: string;
  file: string;
  upload: string;
  openFile: string;
}

export interface SidebarTranslations {
  brandTitle: string;
  brandSubtitle: string;
  appName?: string;
  workspace: string;
  importNav: string;
  categoriesTitle: string;
  settings: string;
  logout: string;
  logoutFailedWarning: string;
  defaultUser: string;
  defaultEmail: string;
}

export interface CategoriesTranslations {
  cooking: string;
  tech: string;
  learning: string;
  work: string;
  finance: string;
  other: string;
  Cooking: string;
  Tech: string;
  Learning: string;
  Work: string;
  Finance: string;
  Other: string;
  cookingDesc: string;
  techDesc: string;
  learningDesc: string;
  workDesc: string;
  financeDesc: string;
  otherDesc: string;
  everythingTaggedAs: string;
  noNotesYet: string;
  noNotesDesc: string;
  errorTitle: string;
  errorMessage: string;
  retryButton: string;
}

export interface AuthTranslations {
  loginTitle: string;
  loginSubtitle: string;
  registerTitle: string;
  registerSubtitle: string;
  email?: string;
  emailLabel: string;
  emailPlaceholder: string;
  password?: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  firstName?: string;
  firstNameLabel: string;
  firstNamePlaceholder: string;
  lastName?: string;
  lastNameLabel: string;
  lastNamePlaceholder: string;
  rememberMe: string;
  forgotPassword: string;
  signIn?: string;
  signInBtn: string;
  signingIn?: string;
  signingInBtn: string;
  createAccount?: string;
  createAccountBtn: string;
  creatingAccount?: string;
  creatingAccountBtn: string;
  orContinueWith: string;
  google: string;
  github: string;
  loginFailed: string;
  loginSuccess?: string;
  registerFailed: string;
  registerSuccess?: string;
  haveAccount: string;
  noAccount: string;
  alreadyHaveAccount?: string;
  dontHaveAccount?: string;
  signInLink: string;
  signUp?: string;
  signUpLink: string;
  createOne?: string;
  backToHome: string;
  brandName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  copyright?: string;
  useTestAccount?: string;
  testAccountHint?: string;
}

export interface NotesTranslations {
  titlePlaceholder?: string;
  importTitle: string;
  importSubtitle: string;
  thoughtPlaceholder: string;
  notionCapture: string;
  charCount: string;
  uploadDoc: string;
  recentImportsTitle: string;
  totalCount: string;
  analyzingTitle: string;
  classifyingCategory: string;
  categories: string;
  aiSearchPlaceholder: string;
  aiAssistant: string;
  aiSearchError: string;
  keyTakeaways: string;
  fullContentAnalysis: string;
  fullContent5W1H: string;
  summary: string;
  attachment: string;
  untitledNote: string;
  processingAi: string;
  aiAnalyzing: string;
  failedToAnalyze: string;
  retryAnalysis: string;
  emptyContent: string;
  words: string;
  items: string;
  actions: string;
  source: string;
  copyJson: string;
  markAsRead: string;
  createdOn: string;
  at: string;
  imageAttachment: string;
  clickToFit: string;
  clickToZoom: string;
  openOriginal: string;
  aiAnalyzingImage: string;
  createCategoryPlaceholder?: string;
  createCategoryButton?: string;
  categoryCreatedSuccess?: string;
  categoryExistsError?: string;
  addCategory?: string;
  newCategory?: string;
}

export interface WsTranslations {
  title: string;
  subtitle: string;
  badgeHandshake: string;
  badgeFrames: string;
  handshakeTitle: string;
  handshakeDesc: string;
  problemLabel: string;
  problemTitle: string;
  mechanismLabel: string;
  mechanismTitle: string;
  detailLabel: string;
  detailTitle: string;
  simLabel: string;
  simTitle: string;
  summaryLabel: string;
  summaryTitle: string;
  summaryQuote: string;
  rfcHandshakeFooter: string;
  nextPhasesLink: string;
  prevPhaseLink: string;
  backToPhase1: string;
  framesTitle: string;
  framesDesc: string;
  phase2Label: string;
  phase2Title: string;
  phase3Label: string;
  phase3Title: string;
  phase4Label: string;
  phase4Title: string;
  phase5Label: string;
  phase5Title: string;
  fullCycleLabel: string;
  fullCycleTitle: string;
  rfcGatewayFooter: string;
  step: string;
  connect: string;
  connected: string;
  disconnected: string;
  payload: string;
  opcode: string;
  mask: string;
  fin: string;
  sendFrame: string;
  logTitle: string;
  clientToServer: string;
  serverToClient: string;
}

export interface TranslationDictionary {
  common: CommonTranslations;
  sidebar: SidebarTranslations;
  categories: CategoriesTranslations;
  auth: AuthTranslations;
  notes: NotesTranslations;
  ws: WsTranslations;
}

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

export type TranslationParams = Record<string, string | number>;

export type TranslateFunction = (
  key: TranslationKey | (string & Record<never, never>),
  params?: TranslationParams
) => string;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslateFunction;
}
