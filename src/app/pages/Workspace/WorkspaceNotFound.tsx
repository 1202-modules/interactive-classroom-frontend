import { useNavigate } from 'react-router-dom';
import { Alert, Breadcrumbs, Button, Icon } from '@gravity-ui/uikit';
import { ArrowLeft } from '@gravity-ui/icons';

interface WorkspaceNotFoundProps {
    error?: string | null;
}

export function WorkspaceNotFound({ error }: WorkspaceNotFoundProps) {
    const navigate = useNavigate();

    return (
        <div className="workspace-page">
            <div className="workspace-page__top">
                <Breadcrumbs>
                    <Breadcrumbs.Item onClick={() => navigate('/dashboard')}>
                        Dashboard
                    </Breadcrumbs.Item>
                    <Breadcrumbs.Item>Workspace</Breadcrumbs.Item>
                </Breadcrumbs>
            </div>

            <Alert
                theme="warning"
                title="Workspace not found"
                message={error || "This workspace does not exist (or isn't available)."}
            />
            <div className="workspace-page__notfound-actions">
                <Button view="action" size="l" onClick={() => navigate('/dashboard')}>
                    <Icon data={ArrowLeft} size={18} />
                    Back to dashboard
                </Button>
            </div>
        </div>
    );
}
