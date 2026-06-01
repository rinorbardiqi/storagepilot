import { useMainView } from '../../hooks/useMainView';
import { useAppStore } from '../../store/appStore';
import { useUiStore } from '../../store/uiStore';
import { DetailPanel } from '../detail/DetailPanel';
import { PropertiesPanel } from '../detail/PropertiesPanel';
import { BucketDetailPanel } from '../detail/BucketDetailPanel';
import { MainPanel } from './MainPanel';
import { Sidebar } from './Sidebar';
import { ActivityDrawer } from './ActivityDrawer';
import { StatusBar } from './StatusBar';
import { TopBar } from './TopBar';
import { ModalHost } from '../modals/ModalHost';
import { PerformanceMetricsModal } from '../modals/PerformanceMetricsModal';
import { TaskRunningWidget } from '../shared/TaskRunningWidget';
import { ToastContainer } from '../shared/Toast';

export function AppShell() {
  const view = useMainView();
  const isOnboarding = view === 'onboarding';
  const currentBucket = useAppStore((s) => s.currentBucket);
  const detailPanelOpen = useUiStore((s) => s.detailPanelOpen);
  const selectedObject = useUiStore((s) => s.selectedObject);
  const propertiesPanelOpen = useUiStore((s) => s.propertiesPanelOpen);
  const bucketDetailPanelOpen = useUiStore((s) => s.bucketDetailPanelOpen);

  const embeddedPanel = view === 'provider-error' || view === 'search-results';
  const showBucketDetail = view === 'bucket-list' && bucketDetailPanelOpen;
  const showObjectDetail =
    view !== 'developer-tools' && !embeddedPanel && detailPanelOpen && selectedObject;
  const showProperties =
    view !== 'developer-tools' &&
    !embeddedPanel &&
    !showObjectDetail &&
    propertiesPanelOpen &&
    Boolean(currentBucket);

  if (isOnboarding) {
    return (
      <>
        <MainPanel />
        <ToastContainer />
        <ModalHost />
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden min-h-0">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          <MainPanel />
        </main>
        {showBucketDetail && <BucketDetailPanel />}
        {showObjectDetail && <DetailPanel />}
        {showProperties && <PropertiesPanel />}
      </div>
      <ActivityDrawer />
      <StatusBar />
      <TaskRunningWidget />
      <ToastContainer />
      <PerformanceMetricsModal />
      <ModalHost />
    </div>
  );
}
