import {Icon, Label} from '@gravity-ui/uikit';
import {Clock} from '@gravity-ui/icons';
import './WipLabel.css';

type WipLabelProps = {
    title?: string;
    className?: string;
};

export function WipLabel({title = 'Work In Progress - This feature is currently under development', className}: WipLabelProps) {
    return (
        <Label
            theme="warning"
            size="s"
            className={className ? `wip-label ${className}` : 'wip-label'}
            title={title}
        >
            <span className="wip-label__icon-wrapper">
                <Icon data={Clock} size={14} />
            </span>
            <span>WIP</span>
        </Label>
    );
}
