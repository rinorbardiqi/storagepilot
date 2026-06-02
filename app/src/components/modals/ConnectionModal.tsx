import { useEffect, useMemo, useState } from 'react';
import type { ProviderType } from '../../api/types';
import type { ConnectionProfile } from '../../api/providerFactory';
import {
  connectionFormFromProfile,
  defaultConnectionForm,
  profileFromForm,
} from '../../lib/connectionForm';
import { useConnectionStore } from '../../store/connectionStore';
import { useModalStore } from '../../store/modalStore';
import { usePreferencesStore } from '../../store/preferencesStore';
import { useToast } from '../../hooks/useToast';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Modal } from '../shared/Modal';
import { ProviderChip } from '../shared/ProviderChip';

const TABS: ProviderType[] = ['gcs', 's3', 'azure'];

function resolveEditingProfile(
  profiles: ConnectionProfile[],
  mode: 'create' | 'edit' | undefined,
  profileId?: string,
): ConnectionProfile | undefined {
  if (mode === 'create') return undefined;
  if (profileId) return profiles.find((p) => p.id === profileId);
  return undefined;
}

export function ConnectionModal() {
  const active = useModalStore((s) => s.active.connection);
  const closeModal = useModalStore((s) => s.closeModal);
  const payload = typeof active === 'object' ? active : undefined;
  const profiles = useConnectionStore((s) => s.profiles);
  const updateProfile = useConnectionStore((s) => s.updateProfile);
  const addProfile = useConnectionStore((s) => s.addProfile);
  const testConnection = useConnectionStore((s) => s.testConnection);
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);
  const toast = useToast();

  const isCreate = payload?.mode === 'create' || (!payload?.profileId && payload?.mode !== 'edit');
  const editingProfile = useMemo(
    () => resolveEditingProfile(profiles, payload?.mode, payload?.profileId),
    [profiles, payload?.mode, payload?.profileId],
  );

  const [tab, setTab] = useState<ProviderType>(payload?.tab ?? editingProfile?.type ?? 'gcs');
  const [name, setName] = useState('');
  const [gcsUrl, setGcsUrl] = useState('');
  const [s3Endpoint, setS3Endpoint] = useState('');
  const [s3AccessKey, setS3AccessKey] = useState('');
  const [s3SecretKey, setS3SecretKey] = useState('');
  const [azureHost, setAzureHost] = useState('');
  const [azureAccount, setAzureAccount] = useState('');
  const [azureAccountKey, setAzureAccountKey] = useState('');

  const isOpen = Boolean(active);

  useEffect(() => {
    if (!isOpen) return;
    const nextTab = payload?.tab ?? editingProfile?.type ?? tab;
    setTab(nextTab);
    const form = connectionFormFromProfile(nextTab, isCreate ? undefined : editingProfile);
    setName(form.name);
    setGcsUrl(form.gcsUrl);
    setS3Endpoint(form.s3Endpoint);
    setS3AccessKey(form.s3AccessKey);
    setS3SecretKey(form.s3SecretKey);
    setAzureHost(form.azureHost);
    setAzureAccount(form.azureAccount);
    setAzureAccountKey(form.azureAccountKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset when modal opens or edit target changes
  }, [isOpen, isCreate, editingProfile?.id, payload?.tab]);

  useEffect(() => {
    if (!isOpen || !isCreate) return;
    const form = defaultConnectionForm(tab);
    setName(form.name);
    setGcsUrl(form.gcsUrl);
    setS3Endpoint(form.s3Endpoint);
    setS3AccessKey(form.s3AccessKey);
    setS3SecretKey(form.s3SecretKey);
    setAzureHost(form.azureHost);
    setAzureAccount(form.azureAccount);
    setAzureAccountKey(form.azureAccountKey);
  }, [tab, isOpen, isCreate]);

  const persistProfile = (): string => {
    const values = {
      name,
      gcsUrl,
      s3Endpoint,
      s3AccessKey,
      s3SecretKey,
      azureHost,
      azureAccount,
      azureAccountKey,
    };

    if (isCreate) {
      const id = crypto.randomUUID();
      const profile = profileFromForm(tab, values, id);
      addProfile(profile);
      useConnectionStore.getState().setActiveProfile(id);
      const prefs = usePreferencesStore.getState();
      if (!prefs.enabledProviders.includes(tab)) {
        prefs.setEnabledProviders([...prefs.enabledProviders, tab]);
      }
      completeOnboarding();
      return id;
    }

    const id = editingProfile?.id ?? payload?.profileId;
    if (!id) return '';
    updateProfile(id, profileFromForm(tab, values, id));
    useConnectionStore.getState().setActiveProfile(id);
    const prefs = usePreferencesStore.getState();
    if (!prefs.enabledProviders.includes(tab)) {
      prefs.setEnabledProviders([...prefs.enabledProviders, tab]);
    }
    completeOnboarding();
    return id;
  };

  const save = () => {
    persistProfile();
    closeModal('connection');
  };

  const handleTest = async () => {
    const id = persistProfile();
    if (!id) return;
    const ok = await testConnection(id);
    toast[ok ? 'success' : 'error'](ok ? 'Connection successful' : 'Connection failed');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => closeModal('connection')}
      title={isCreate ? 'Add connection' : 'Connection settings'}
      size="lg"
      footer={
        <>
          <Button onClick={() => closeModal('connection')}>Cancel</Button>
          <Button onClick={() => void handleTest()}>Test connection</Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </>
      }
    >
      {isCreate ? (
        <div className="flex gap-1 mb-4 border-b border-[var(--border)]">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              className={`px-3 py-2 text-sm border-b-2 -mb-px ${
                tab === t
                  ? 'border-[var(--accent-gcs)] text-[var(--text-primary)]'
                  : 'border-transparent text-[var(--text-muted)]'
              }`}
              onClick={() => setTab(t)}
            >
              <ProviderChip type={t} />
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-4">
          <ProviderChip type={tab} />
        </div>
      )}
      <Input label="Profile name" value={name} onChange={(e) => setName(e.target.value)} />
      {tab === 'gcs' && (
        <Input label="GCS base URL" value={gcsUrl} onChange={(e) => setGcsUrl(e.target.value)} className="mt-3" />
      )}
      {tab === 's3' && (
        <>
          <Input label="S3 endpoint" value={s3Endpoint} onChange={(e) => setS3Endpoint(e.target.value)} className="mt-3" placeholder="http://localhost:9000" />
          <Input label="Access key" value={s3AccessKey} onChange={(e) => setS3AccessKey(e.target.value)} className="mt-3" />
          <Input label="Secret key" type="password" value={s3SecretKey} onChange={(e) => setS3SecretKey(e.target.value)} className="mt-3" />
        </>
      )}
      {tab === 'azure' && (
        <>
          <Input label="Blob service URL" value={azureHost} onChange={(e) => setAzureHost(e.target.value)} className="mt-3" placeholder="http://localhost:10000/devstoreaccount1" />
          <Input label="Account name" value={azureAccount} onChange={(e) => setAzureAccount(e.target.value)} className="mt-3" />
          <Input label="Account key" type="password" value={azureAccountKey} onChange={(e) => setAzureAccountKey(e.target.value)} className="mt-3" />
        </>
      )}
    </Modal>
  );
}
