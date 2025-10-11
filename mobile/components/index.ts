// Shared Components Export

// UI Primitives
export { ScreenHeader } from "./ui/screen-header";
export { FormSection } from "./ui/form-section";
export { FormLabel } from "./ui/form-label";
export { FormInput } from "./ui/form-input";
export { FormField, TextFormField } from "./ui/form-field";
export { FormActions } from "./ui/form-actions";
export { PrimaryButton } from "./ui/primary-button";
export { InfoBox } from "./ui/info-box";
export { OptionGrid, type Option } from "./ui/option-grid";
export { SwitchRow } from "./ui/switch-row";
export { SearchBar } from "./ui/search-bar";
export { UserAvatar } from "./ui/user-avatar";
export { UserStats } from "./ui/user-stats";
export { UserActions } from "./ui/user-actions";
export { LoadingSpinner } from "./ui/loading-spinner";
export { IconButton } from "./ui/icon-button";
export { Card } from "./ui/card";

// Forms
export { PostForm } from "./forms/post-form";
export { CliqueForm } from "./forms/clique-form";
export { ServiceForm } from "./forms/service-form";

// Modals
export { LogoutModal } from "./modals/logout-modal";

// Lists
export { PostItem } from "./lists/post-item";
export { CategoryFilter } from "./lists/category-filter";
export { PostsList } from "./lists/posts-list";

// Headers
import CliqueHeader from "./headers/clique-header";
import UserProfileHeader from "./headers/user-profile-header";
export { CliqueHeader, UserProfileHeader };

// User Components
import UserTabs from "./ui/user-tabs";
export { UserTabs };

// Clique Components
import CliqueDetailHeader from "./ui/clique-header";
import CliqueTabs from "./ui/clique-tabs";
import CliqueAboutTab from "./ui/clique-about-tab";
import CliquePostsTab from "./ui/clique-posts-tab";
export { CliqueDetailHeader, CliqueTabs, CliqueAboutTab, CliquePostsTab };

// States
export { EmptyState } from "./states/empty-state";
export { GenericEmptyState } from "./states/generic-empty-state";
export { NotLoggedInState } from "./states/not-logged-in-state";

// Menus
export { MenuSection } from "./menus/menu-section";

// Uncategorized
import AboutTab from "./about-tab";
export { AboutTab };

// Re-export common types for convenience
export type { Option as OptionType } from "./ui/option-grid";
