import { Breadcrumbs, Card, Skeleton } from '@gravity-ui/uikit';

export function WorkspaceLoading() {
    return (
        <div className="workspace-page">
            <div className="workspace-page__top">
                <Breadcrumbs>
                    <Breadcrumbs.Item>Dashboard</Breadcrumbs.Item>
                    <Breadcrumbs.Item>Workspace</Breadcrumbs.Item>
                </Breadcrumbs>
            </div>
            <Card view="outlined" className="workspace-page__skeleton">
                <Skeleton style={{ width: '60%', height: 28, borderRadius: 8 }} />
                <Skeleton style={{ width: '80%', height: 16, borderRadius: 6, marginTop: 8 }} />
            </Card>
        </div>
    );
}
