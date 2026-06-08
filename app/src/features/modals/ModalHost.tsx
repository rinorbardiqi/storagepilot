import { BulkConfirmModal } from './BulkConfirmModal';
import { CommandPalette } from './CommandPalette';
import { ConnectionModal } from './ConnectionModal';
import { CopyMoveModal } from './CopyMoveModal';
import { CorsEditorModal } from './CorsEditorModal';
import { DeveloperToolsModal } from './DeveloperToolsModal';
import { ExportImportModal } from './ExportImportModal';
import { FakeDataModal } from './FakeDataModal';
import { NewBucketModal } from './NewBucketModal';
import { NewFolderModal } from './NewFolderModal';
import { PermissionsModal } from './PermissionsModal';
import { ShortcutsModal } from './ShortcutsModal';
import { SnippetModal } from './SnippetModal';
import { StatsModal } from './StatsModal';
import { UploadModal } from './UploadModal';

export function ModalHost() {
  return (
    <>
      <ConnectionModal />
      <NewBucketModal />
      <UploadModal />
      <CopyMoveModal />
      <StatsModal />
      <CorsEditorModal />
      <FakeDataModal />
      <SnippetModal />
      <ExportImportModal />
      <DeveloperToolsModal />
      <PermissionsModal />
      <ShortcutsModal />
      <BulkConfirmModal />
      <NewFolderModal />
      <CommandPalette />
    </>
  );
}
