/*
 * SPDX-License-Identifier: Apache-2.0
 * SPDX-FileCopyrightText: Huawei Inc.
 */

import { Alert } from 'antd';
import OrderSubmitResultDetails from './OrderSubmitResultDetails';
import { StopwatchResult } from 'react-timer-hook';
import { DeployedServiceDetails } from '../../../../xpanse-api/generated';
import DeploymentTimer from './DeploymentTimer';
import React from 'react';
import { OperationType } from '../types/OperationType';

export const OrderSubmitResult = (
    msg: string | React.JSX.Element,
    uuid: string,
    type: 'success' | 'error',
    deploymentStatus: DeployedServiceDetails.serviceDeploymentState,
    stopWatch: StopwatchResult,
    operationType: OperationType
): React.JSX.Element => {
    return (
        <div className={'submit-alert-tip'}>
            {' '}
            <Alert
                message={`Processing Status`}
                description={<OrderSubmitResultDetails msg={msg} uuid={uuid} />}
                showIcon
                closable={true}
                type={type}
                action={
                    <DeploymentTimer
                        stopWatch={stopWatch}
                        deploymentStatus={deploymentStatus}
                        operationType={operationType}
                    />
                }
            />{' '}
        </div>
    );
};
