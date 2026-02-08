import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Icon,
    Skeleton,
    Spin,
    Tab,
    TabList,
    TabProvider,
    Text,
    TextInput,
} from '@gravity-ui/uikit';
import { Magnifier, Plus } from '@gravity-ui/icons';
import { useNavigate } from 'react-router-dom';
import WorkspaceCard from '../../components/WorkspaceCard/WorkspaceCard';
import { useApi } from '@/hooks/useApi';
import type { Workspace } from '../../types/workspace';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const api = useApi();
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'trash'>('active');
    const [displayedTab, setDisplayedTab] = useState<'active' | 'archive' | 'trash'>('active');
    const [dataLoading, setDataLoading] = useState(false);
    const [error, setError] = useState('');
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const filteredWorkspaces = useMemo(() => {
        const listForTab = workspaces.filter((workspace) => {
            if (displayedTab === 'trash') {
                return workspace.is_deleted === true || workspace.status === 'trash';
            }
            if (displayedTab === 'active') return workspace.status === 'active';
            if (displayedTab === 'archive') return workspace.status === 'archive';
            return true;
        });

        if (!searchQuery.trim()) return listForTab;
        const search = searchQuery.toLowerCase();
        return listForTab.filter((workspace) => {
            const nameMatches = workspace.name.toLowerCase().includes(search);
            const descMatches = (workspace.description || '').toLowerCase().includes(search);
            return nameMatches || descMatches;
        });
    }, [workspaces, displayedTab, searchQuery]);

    const startTabTransition = (tabId: 'active' | 'archive' | 'trash') => {
        if (tabId === activeTab) return;
        setActiveTab(tabId);
        setDisplayedTab(tabId);
    };

    const fetchWorkspaces = useCallback(async (tab: 'active' | 'archive' | 'trash') => {
        setError('');
        setDataLoading(true);
        try {
            const statusParam = tab === 'trash' ? undefined : tab === 'active' ? 'active' : 'archive';
            const includeDeleted = tab === 'trash';
            const res = await api.get<{ workspaces: Workspace[]; total: number }>('/workspaces', {
                params: {
                    status: statusParam,
                    include_deleted: includeDeleted,
                    // fields:
                    //     'id,name,description,status,is_deleted,participant_count,session_count,has_live_session,live_session_name,last_session_started_at,created_at,updated_at',
                },
            });
            setWorkspaces(res.data?.workspaces || []);
        } catch (err: any) {
            const message =
                err?.response?.data?.detail || err?.response?.data || 'Не удалось загрузить рабочие пространства';
            setError(typeof message === 'string' ? message : 'Не удалось загрузить рабочие пространства');
        } finally {
            setDataLoading(false);
        }
    }, [api]);

    useEffect(() => {
        fetchWorkspaces(activeTab);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, fetchWorkspaces]);

    const handleRefresh = useCallback(async () => {
        await fetchWorkspaces(activeTab);
    }, [fetchWorkspaces, activeTab]);

    const skeletonCount = 5;
    const isGridLoading = dataLoading;

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
                        <TabProvider
                            value={activeTab}
                            onUpdate={(value) =>
                                startTabTransition(value as 'active' | 'archive' | 'trash')
                            }
                        >
                            <TabList className="dashboard__tabs-vertical">
                                <Tab value="active">Active</Tab>
                                <Tab value="archive">Archive</Tab>
                                <Tab value="trash">Trash</Tab>
                            </TabList>
                        </TabProvider>
                    </aside>

                    <div className="dashboard__main">
                        <Card className="dashboard__filters" view="outlined">
                            <div className="dashboard__filters-content">
                                <Button
                                    view="action"
                                    size="l"
                                    onClick={() => navigate('/workspace/create')}
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

                        {error ? (
                            <Card className="dashboard__empty" view="outlined">
                                <Text variant="body-1" color="danger">
                                    {error}
                                </Text>
                            </Card>
                        ) : !isGridLoading && filteredWorkspaces.length === 0 ? (
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
                                    isGridLoading ? 'dashboard__grid-wrap_loading' : '',
                                ].join(' ')}
                            >
                                <div className="dashboard__grid" aria-busy={isGridLoading || undefined}>
                                    {isGridLoading
                                        ? Array.from({ length: skeletonCount }).map((_, index) => (
                                            <Card
                                                key={index}
                                                className="workspace-card"
                                                view="outlined"
                                            >
                                                <div className="workspace-card__header">
                                                    <Skeleton
                                                        style={{
                                                            width: '70%',
                                                            height: 18,
                                                            borderRadius: 6,
                                                        }}
                                                    />
                                                </div>
                                                <div className="workspace-card__description">
                                                    <Skeleton
                                                        style={{
                                                            width: '100%',
                                                            height: 14,
                                                            borderRadius: 6,
                                                        }}
                                                    />
                                                </div>
                                                <div className="workspace-card__footer">
                                                    <Skeleton
                                                        style={{
                                                            width: 52,
                                                            height: 16,
                                                            borderRadius: 6,
                                                        }}
                                                    />
                                                    <Skeleton
                                                        style={{
                                                            width: 40,
                                                            height: 16,
                                                            borderRadius: 6,
                                                        }}
                                                    />
                                                </div>
                                            </Card>
                                        ))
                                        : filteredWorkspaces.map((workspace) => (
                                            <WorkspaceCard
                                                key={workspace.id}
                                                workspace={workspace}
                                                currentTab={displayedTab}
                                                onChange={handleRefresh}
                                            />
                                        ))}
                                </div>

                                {isGridLoading && (
                                    <div
                                        className="dashboard__loading-overlay"
                                        aria-label="Loading"
                                    >
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
