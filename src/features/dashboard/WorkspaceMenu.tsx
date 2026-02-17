import type { DropdownMenuItem } from '@gravity-ui/uikit';
import { Icon } from '@gravity-ui/uikit';
import { Archive, ArrowRotateLeft, TrashBin, Xmark } from '@gravity-ui/icons';
import type { Workspace } from '@/shared/types/workspace';
import { formatShortDate } from '@/shared/utils/date';

type Tab = 'active' | 'archive' | 'trash';

export function getWorkspaceMoreMenuItems(params: {
    workspace: Workspace;
    currentTab?: Tab;
    onRestoreFromArchive: () => void;
    onRestoreFromTrash: () => void;
    onMoveToArchive: () => void;
    onMoveToTrash: () => void;
    onDeletePermanently: () => void;
}): DropdownMenuItem[][] {
    const { workspace, currentTab } = params;

    const isTrash = currentTab === 'trash' || workspace.is_deleted === true;
    const isArchive = currentTab === 'archive' || workspace.status === 'archive';

    const updatedCaption: DropdownMenuItem = {
        text: `Updated: ${formatShortDate(workspace.updated_at)}`,
        action: () => { },
        disabled: true,
    };

    if (isTrash) {
        return [
            [
                {
                    text: 'Restore from trash',
                    iconStart: <Icon data={ArrowRotateLeft} size={16} />,
                    action: params.onRestoreFromTrash,
                },
                {
                    text: 'Delete permanently',
                    iconStart: <Icon data={Xmark} size={16} />,
                    theme: 'danger' as const,
                    action: params.onDeletePermanently,
                },
                updatedCaption,
            ],
        ];
    }

    if (isArchive) {
        return [
            [
                {
                    text: 'Restore from archive',
                    iconStart: <Icon data={ArrowRotateLeft} size={16} />,
                    action: params.onRestoreFromArchive,
                },
                {
                    text: 'Move to trash',
                    iconStart: <Icon data={TrashBin} size={16} />,
                    theme: 'danger' as const,
                    action: params.onMoveToTrash,
                },
                updatedCaption,
            ],
        ];
    }

    return [
        [
            {
                text: 'Move to archive',
                iconStart: <Icon data={Archive} size={16} />,
                action: params.onMoveToArchive,
            },
            {
                text: 'Move to trash',
                iconStart: <Icon data={TrashBin} size={16} />,
                theme: 'danger' as const,
                action: params.onMoveToTrash,
            },
            updatedCaption,
        ],
    ];
}
