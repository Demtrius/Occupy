// Navigation Types

export type RootStackParamList = {
  Landing: undefined;
  SignIn: undefined;
  Register: undefined;
  SignInBusiness: undefined;
  RegisterBusiness: undefined;
  Home: undefined;
  Feed: undefined;
  Search: undefined;
  ViewUser: { id: number };
  Cliques: undefined;
  Clique: { id: number };
  CreateClique: undefined;
  Post: undefined;
  PostDetail: { id: number };
  Notifications: undefined;
  MessageDetail: { id: number };
  Profile: undefined;
};

export type TabParamList = {
  Home: undefined;
  SearchTab: undefined;
  CliquesTab: undefined;
  Post: undefined;
  NotificationsTab: undefined;
  Profile: undefined;
};
