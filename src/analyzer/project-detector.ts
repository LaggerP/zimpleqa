export type ProjectType = 'nextjs' | 'react' | 'vue' | 'unknown';
export type RouterType = 'app' | 'pages' | 'react-router' | 'vue-router' | 'unknown';

export interface ProjectInfo {
  type: ProjectType;
  routerType: RouterType;
  rootPath: string;
  packageJson: {
    name?: string;
    dependencies: Record<string, string>;
    devDependencies: Record<string, string>;
    scripts: Record<string, string>;
  } | null;
  routes: string[];
  components: string[];
}

export interface DetectedFeature {
  name: string;
  type: FeatureType;
  priority: 'high' | 'medium' | 'low';
  routes: string[];
  components: string[];
  confidence: number;
  description?: string;
}

export type FeatureType = 
  | 'auth' 
  | 'payment' 
  | 'checkout' 
  | 'form' 
  | 'search' 
  | 'profile' 
  | 'dashboard' 
  | 'api' 
  | 'static' 
  | 'navigation'
  | 'crud'
  | 'upload'
  | 'notification'
  | 'settings'
  | 'unknown';

export const CRITICALITY_MAP: Record<FeatureType, 'high' | 'medium' | 'low'> = {
  'auth': 'high',
  'payment': 'high',
  'checkout': 'high',
  'form': 'medium',
  'search': 'medium',
  'profile': 'medium',
  'dashboard': 'medium',
  'api': 'medium',
  'static': 'low',
  'navigation': 'low',
  'crud': 'medium',
  'upload': 'medium',
  'notification': 'medium',
  'settings': 'medium',
  'unknown': 'low'
};

export const FEATURE_PATTERNS: Record<FeatureType, RegExp[]> = {
  'auth': [
    /login/i, /logout/i, /signin/i, /signout/i, /register/i, /signup/i, 
    /auth/i, /authentication/i, /password/i, /forgot.?password/i,
    /reset.?password/i, /oauth/i, /session/i, /token/i
  ],
  'payment': [
    /payment/i, /stripe/i, /paypal/i, /credit.?card/i, /billing/i,
    /checkout/i, /purchase/i, /transaction/i, /invoice/i
  ],
  'checkout': [
    /checkout/i, /cart/i, /basket/i, /order/i, /shipping/i, /delivery/i
  ],
  'form': [
    /form/i, /input/i, /submit/i, /validation/i, /field/i
  ],
  'search': [
    /search/i, /filter/i, /query/i, /results/i, /autocomplete/i
  ],
  'profile': [
    /profile/i, /account/i, /user.?settings/i, /avatar/i, /edit.?profile/i
  ],
  'dashboard': [
    /dashboard/i, /admin/i, /panel/i, /overview/i, /analytics/i, /metrics/i
  ],
  'api': [
    /api/i, /endpoint/i, /graphql/i, /rest/i, /fetch/i, /axios/i
  ],
  'static': [
    /about/i, /contact/i, /faq/i, /help/i, /terms/i, /privacy/i, /legal/i
  ],
  'navigation': [
    /nav/i, /menu/i, /sidebar/i, /header/i, /footer/i, /breadcrumb/i
  ],
  'crud': [
    /create/i, /read/i, /update/i, /delete/i, /edit/i, /list/i, /table/i
  ],
  'upload': [
    /upload/i, /file/i, /image/i, /attachment/i, /drag.?drop/i
  ],
  'notification': [
    /notification/i, /alert/i, /toast/i, /message/i, /email/i
  ],
  'settings': [
    /settings/i, /config/i, /preferences/i, /options/i
  ],
  'unknown': []
};

export const COMPONENT_PATTERNS: Record<FeatureType, RegExp[]> = {
  'auth': [
    /<LoginForm/i, /<RegisterForm/i, /<SignIn/i, /<SignUp/i, /<AuthProvider/i,
    /useAuth/, /<LogoutButton/i
  ],
  'payment': [
    /<PaymentForm/i, /<Stripe/i, /<PayPal/i, /<CreditCard/i, /<Checkout/i
  ],
  'checkout': [
    /<Cart/i, /<Checkout/i, /<OrderSummary/i, /<ShippingForm/i
  ],
  'form': [
    /<Form/i, /<Input/i, /<TextField/i, /<Select/i, /<Checkbox/i, /<Radio/i,
    /useForm/, /react-hook-form/
  ],
  'search': [
    /<SearchBar/i, /<SearchInput/i, /<SearchResults/i, /<Filter/i
  ],
  'profile': [
    /<Profile/i, /<Avatar/i, /<UserCard/i, /<AccountSettings/i
  ],
  'dashboard': [
    /<Dashboard/i, /<Chart/i, /<Widget/i, /<Stats/i, /<Metrics/i
  ],
  'api': [
    /<ApiProvider/i, /<QueryProvider/i, /useQuery/, /useMutation/
  ],
  'static': [
    /<About/i, /<Contact/i, /<FAQ/i, /<Help/i
  ],
  'navigation': [
    /<Nav/i, /<Menu/i, /<Sidebar/i, /<Header/i, /<Footer/i, /<Link/i
  ],
  'crud': [
    /<Table/i, /<DataGrid/i, /<List/i, /<CreateButton/i, /<EditButton/i, /<DeleteButton/i
  ],
  'upload': [
    /<FileUpload/i, /<Dropzone/i, /<ImageUpload/i
  ],
  'notification': [
    /<Toast/i, /<Alert/i, /<Notification/i, /<Snackbar/i
  ],
  'settings': [
    /<Settings/i, /<Preferences/i, /<Config/i
  ],
  'unknown': []
};
