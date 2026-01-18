import React from 'react';
import {Icon, Text} from '@gravity-ui/uikit';
import {GraduationCap} from '@gravity-ui/icons';
import './Oops.css';

const Oops: React.FC = () => {
    return (
        <div className="oops">
            <div className="oops__content">
                <Icon data={GraduationCap} size={120} className="oops__icon" />
                <Text variant="display-1" className="oops__title">
                    Oops!
                </Text>
                <Text variant="body-1" color="secondary" className="oops__message">
                    This page is not ready yet.
                </Text>
            </div>
        </div>
    );
};

export default Oops;
