import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Text, Button, Icon, DropdownMenu } from '@gravity-ui/uikit';
import { Pencil, Persons, Calendar, EllipsisVertical } from '@gravity-ui/icons';
import type { Workspace } from '../../types/workspace';
import { ConfirmDialog } from '../ConfirmDialog/ConfirmDialog';
import { workspaceActions } from '../../services/workspaceActions';
import { formatShortDate } from '../../utils/date';
import { getWorkspaceMoreMenuItems } from './workspaceMenu';
import './WorkspaceCard.css';

interface WorkspaceCardProps {
  workspace: Workspace;
  currentTab?: 'active' | 'archive' | 'trash';
}

const WorkspaceCard: React.FC<WorkspaceCardProps> = ({ workspace, currentTab }) => {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isTrash = currentTab === 'trash' || workspace.status === 'trash';

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if in trash or clicking on buttons or dropdown
    if (isTrash) {
      return;
    }
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('[role="menu"]')) {
      return;
    }
    navigate(`/template/workspace/${workspace.id}`);
  };

  const handleEdit = () => {
    navigate(`/template/workspace/${workspace.id}?tab=settings`);
  };

  const handleDeletePermanently = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDeletePermanently = () => {
    setIsDeleteDialogOpen(false);
    workspaceActions.deletePermanently(workspace.id);
  };

  const moreMenuItems = getWorkspaceMoreMenuItems({
    workspace,
    currentTab,
    onRestoreFromArchive: () => workspaceActions.restoreFromArchive(workspace.id),
    onRestoreFromTrash: () => workspaceActions.restoreFromTrash(workspace.id),
    onMoveToArchive: () => workspaceActions.moveToArchive(workspace.id),
    onMoveToTrash: () => workspaceActions.moveToTrash(workspace.id),
    onDeletePermanently: handleDeletePermanently,
  });

  return (
    <div 
      className="workspace-card-wrapper"
      onClick={handleCardClick} 
      style={{ cursor: isTrash ? 'default' : 'pointer' }}
    >
      <Card
        className={`workspace-card ${workspace.has_live_session ? 'workspace-card_live' : ''}`}
        view="outlined"
      >
      <div className="workspace-card__header">
        <Text variant="subheader-3" ellipsis className="workspace-card__title">
          {workspace.name}
        </Text>
        {workspace.has_live_session && (
          <span 
            className="workspace-card__live"
            title={workspace.live_session_name ? `Live session: ${workspace.live_session_name}` : 'Live session'}
          >
            <span className="workspace-card__live-dot" aria-hidden />
            <Text variant="body-2">Live</Text>
          </span>
        )}
      </div>

      {workspace.description && (
        <div className="workspace-card__description">
          <Text variant="body-3" color="secondary" className="workspace-card__description-text">
            {workspace.description}
          </Text>
        </div>
      )}

      <div className="workspace-card__footer">
        <span 
          className="workspace-card__stat"
          title={`Participants: ${workspace.participant_count}`}
        >
          <Icon data={Persons} size={16} />
          <Text variant="body-2" color="secondary">{workspace.participant_count}</Text>
        </span>
        <span 
          className="workspace-card__stat"
          title={`Sessions: ${workspace.session_count}`}
        >
          <Icon data={Calendar} size={16} />
          <Text variant="body-2" color="secondary">{workspace.session_count}</Text>
        </span>
        <Text variant="body-1" color="hint" className="workspace-card__last-session">
          Last: {formatShortDate(workspace.last_session_started_at)}
        </Text>
        {!isTrash && (
        <Button
          view="flat"
          size="s"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit();
            }}
          title="Edit"
        >
          <Icon data={Pencil} size={16} />
        </Button>
        )}
        <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu
          items={moreMenuItems}
          renderSwitcher={(props) => (
            <Button {...props} view="flat" size="s" title="More options">
              <Icon data={EllipsisVertical} size={16} />
            </Button>
          )}
        />
        </div>
      </div>
    </Card>
    <ConfirmDialog
      open={isDeleteDialogOpen}
      title="Confirm deletion"
      message="Are you sure you want to delete permanently?"
      cancelText="Cancel"
      confirmText="Delete permanently"
      onCancel={() => setIsDeleteDialogOpen(false)}
      onConfirm={confirmDeletePermanently}
    />
    </div>
  );
};

export default WorkspaceCard;
