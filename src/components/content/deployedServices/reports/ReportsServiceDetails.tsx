/*
 * SPDX-License-Identifier: Apache-2.0
 * SPDX-FileCopyrightText: Huawei Inc.
 */

import { Alert, Skeleton } from 'antd';
import React from 'react';
import '../../../../styles/app.css';
import useGetServiceDetailsByIdForIsvQuery from './query/useGetServiceDetailsByIdForIsvQuery';
import { ApiError, DeployResource, Response } from '../../../../xpanse-api/generated';
import { convertStringArrayToUnorderedList } from '../../../utils/generateUnorderedList';
import { DeploymentResultMessage } from '../common/DeploymentResultMessage';
import { DeployedServicesDetailsContent } from '../common/DeployedServicesDetailsContent';

export const ReportsServiceDetails = ({ serviceId }: { serviceId: string }): React.JSX.Element => {
    const getServiceDetailsByIdQuery = useGetServiceDetailsByIdForIsvQuery(serviceId);

    if (getServiceDetailsByIdQuery.isSuccess) {
        const endPointMap = new Map<string, string>();
        const requestMap = new Map<string, unknown>();
        let resultMessage = undefined;
        let deployResourceMap: DeployResource[] = [];
        if (getServiceDetailsByIdQuery.data.deployedServiceProperties) {
            for (const key in getServiceDetailsByIdQuery.data.deployedServiceProperties) {
                endPointMap.set(key, getServiceDetailsByIdQuery.data.deployedServiceProperties[key]);
            }
        }
        if (getServiceDetailsByIdQuery.data.deployRequest.serviceRequestProperties) {
            for (const key in getServiceDetailsByIdQuery.data.deployRequest.serviceRequestProperties) {
                requestMap.set(key, getServiceDetailsByIdQuery.data.deployRequest.serviceRequestProperties[key]);
            }
        }

        const serviceDetailVo = getServiceDetailsByIdQuery.data;
        if (serviceDetailVo.resultMessage) {
            resultMessage = DeploymentResultMessage(serviceDetailVo.resultMessage);
        }
        if (serviceDetailVo.deployResources) {
            deployResourceMap = serviceDetailVo.deployResources;
        }

        return (
            <>
                <DeployedServicesDetailsContent
                    content={endPointMap}
                    requestParams={requestMap}
                    resultMessage={resultMessage}
                    deployResources={deployResourceMap}
                />
            </>
        );
    }

    if (getServiceDetailsByIdQuery.isLoading) {
        return (
            <Skeleton
                className={'my-service-details-skeleton'}
                active={true}
                loading={getServiceDetailsByIdQuery.isLoading}
                paragraph={{ rows: 2, width: ['20%', '20%'] }}
                title={{ width: '5%' }}
            />
        );
    }

    if (getServiceDetailsByIdQuery.isError) {
        if (
            getServiceDetailsByIdQuery.error instanceof ApiError &&
            'details' in getServiceDetailsByIdQuery.error.body
        ) {
            const response: Response = getServiceDetailsByIdQuery.error.body as Response;
            return (
                <Alert
                    message={response.resultType.valueOf()}
                    description={convertStringArrayToUnorderedList(response.details)}
                    type={'error'}
                    closable={true}
                    className={'my-service-details-skeleton'}
                />
            );
        } else if (getServiceDetailsByIdQuery.error instanceof Error) {
            return (
                <Alert
                    message='Fetching Service Details Failed'
                    description={getServiceDetailsByIdQuery.error.message}
                    type={'error'}
                    closable={true}
                    className={'my-service-details-skeleton'}
                />
            );
        }
    }

    return <></>;
};
