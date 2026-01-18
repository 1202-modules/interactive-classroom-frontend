import React, { useState, useMemo } from 'react';
import {
  Button,
  Text,
  TextInput,
  Card,
  Icon,
  Skeleton,
  Spin,
} from '@gravity-ui/uikit';
import { Magnifier, Plus } from '@gravity-ui/icons';
import { TabProvider, TabList, Tab } from '@gravity-ui/uikit';
import { useNavigate } from 'react-router-dom';
import WorkspaceCard from '../../components/WorkspaceCard/WorkspaceCard';
import { mockWorkspaces } from '../../data/mockWorkspaces';
// TODO: Replace with API call - import { getWorkspaces } from '../../api/workspaces';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'trash'>('active');
  const [displayedTab, setDisplayedTab] = useState<'active' | 'archive' | 'trash'>('active');
  const [isLoading, setIsLoading] = useState(false);

  // TODO: Replace with API call - const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  // TODO: useEffect(() => { getWorkspaces().then(setWorkspaces); }, []);
  const filteredWorkspaces = useMemo(() => {
    return mockWorkspaces.filter((workspace) => {
      const matchesSearch =
        searchQuery === '' ||
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workspace.description &&
          workspace.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus =
        (displayedTab === 'active' && workspace.status === 'active') ||
        (displayedTab === 'archive' && workspace.status === 'archive') ||
        (displayedTab === 'trash' && workspace.status === 'trash');

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, displayedTab]);

  const startTabTransition = (tabId: 'active' | 'archive' | 'trash') => {
    if (tabId === activeTab) return;

    setActiveTab(tabId);
    setIsLoading(true);

    window.setTimeout(() => {
      setDisplayedTab(tabId);
      setIsLoading(false);
    }, 200);
  };

  const skeletonCount = 5;

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <div className="dashboard__title-section">
          <Text variant="display-2" as="h1">
            Workspaces
          </Text>
          <Text variant="body-2" color="secondary">
            Manage your workspaces
          </Text>
        </div>
      </div>

      <div className="dashboard__content">
        <div className="dashboard__center-wrap">
          <aside className="dashboard__sidebar" aria-label="Workspace filters">
            <TabProvider value={activeTab} onUpdate={(value) => startTabTransition(value as 'active' | 'archive' | 'trash')}>
              <TabList className="dashboard__tabs-vertical">
                <Tab value="active">
                  Active
                </Tab>
                <Tab value="archive">
                  Archive
                </Tab>
                <Tab value="trash">
                  Trash
                </Tab>
              </TabList>
            </TabProvider>
          </aside>

          <div className="dashboard__main">
      <Card className="dashboard__filters" view="outlined">
        <div className="dashboard__filters-content">
                <Button
                  view="action"
                  size="l"
                  onClick={() => navigate('/template/workspace/create')}
                  className="dashboard__create-button"
                >
                  <Icon data={Plus} size={18} />
                  Create new
                </Button>
          <TextInput
            value={searchQuery}
            onUpdate={setSearchQuery}
            placeholder="Search by name or description..."
                  startContent={<Icon data={Magnifier} size={16} />}
            size="l"
            className="dashboard__search"
          />
        </div>
      </Card>

            {!isLoading && filteredWorkspaces.length === 0 ? (
        <Card className="dashboard__empty" view="outlined">
          <Text variant="body-1" color="secondary">
                  {searchQuery || displayedTab !== 'active'
              ? 'Nothing found. Try changing the filters.'
              : "You don't have any workspaces yet. Create your first!"}
          </Text>
        </Card>
      ) : (
              <div
                className={[
                  'dashboard__grid-wrap',
                  isLoading ? 'dashboard__grid-wrap_loading' : '',
                ].join(' ')}
              >
                <div className="dashboard__grid" aria-busy={isLoading || undefined}>
                  {isLoading
                    ? Array.from({ length: skeletonCount }).map((_, index) => (
                      <Card key={index} className="workspace-card" view="outlined">
                        <div className="workspace-card__header">
                          <Skeleton style={{ width: '70%', height: 18, borderRadius: 6 }} />
                        </div>
                        <div className="workspace-card__description">
                          <Skeleton style={{ width: '100%', height: 14, borderRadius: 6 }} />
                        </div>
                        <div className="workspace-card__footer">
                          <Skeleton style={{ width: 52, height: 16, borderRadius: 6 }} />
                          <Skeleton style={{ width: 40, height: 16, borderRadius: 6 }} />
                        </div>
                      </Card>
                    ))
                    : filteredWorkspaces.map((workspace) => (
                      <WorkspaceCard 
                        key={workspace.id} 
                        workspace={workspace} 
                        currentTab={displayedTab}
                      />
          ))}
                </div>

                {isLoading && (
                  <div className="dashboard__loading-overlay" aria-label="Loading">
                    <Spin size="l" />
                  </div>
                )}
        </div>
      )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

