import { useMainView } from '../../hooks/useMainView';
import { BucketListView } from '../views/BucketListView';
import { NotFoundView } from '../views/NotFoundView';
import { ObjectBrowserView } from '../views/ObjectBrowserView';
import { OnboardingView } from '../views/OnboardingView';
import { ProviderErrorView } from '../views/ProviderErrorView';
import { ProviderNotConnectedView } from '../views/ProviderNotConnectedView';
import { DeveloperToolsView } from '../views/DeveloperToolsView';
import { SearchResultsView } from '../views/SearchResultsView';

export function MainPanel() {
  const view = useMainView();

  switch (view) {
    case 'onboarding':
      return <OnboardingView />;
    case 'provider-not-connected':
      return <ProviderNotConnectedView />;
    case 'provider-error':
      return <ProviderErrorView />;
    case 'not-found':
      return <NotFoundView />;
    case 'bucket-list':
      return <BucketListView />;
    case 'search-results':
      return <SearchResultsView />;
    case 'developer-tools':
      return <DeveloperToolsView />;
    case 'object-browser':
    default:
      return <ObjectBrowserView />;
  }
}
