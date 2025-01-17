/*
 * SPDX-License-Identifier: Apache-2.0
 * SPDX-FileCopyrightText: Huawei Inc.
 */

import React, { useEffect, useState } from 'react';
import { Button, Image, Modal, Popconfirm, Popover, Space, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import '../../../styles/policies.css';
import useListPoliciesManagementServiceQuery from './useListPoliciesManagementServiceQuery';
import { AbstractCredentialInfo, CloudServiceProvider, Policy } from '../../../xpanse-api/generated';
import { ColumnFilterItem } from 'antd/es/table/interface';
import PoliciesManagementServiceListError from './PoliciesManagementServiceListError';
import { CloseCircleOutlined, EditOutlined, PlusCircleOutlined, SyncOutlined } from '@ant-design/icons';
import { AddOrUpdatePolicy } from './AddOrUpdatePolicy';
import PolicyDeleteResultStatus from './delete/PolicyDeleteResultStatus';
import { updateCspFilters, updateEnabledFilters } from './policiesParams';
import { useDeletePolicyRequest } from './delete/useDeletePolicyRequest';
import { cspMap } from '../common/csp/CspLogo';

function Policies(): React.JSX.Element {
    const [id, setId] = useState<string>('');
    const [currentPolicyService, setCurrentPolicyService] = useState<Policy | undefined>(undefined);
    const [cspFilters, setCspFilters] = useState<ColumnFilterItem[]>([]);
    const [enabledFilters, setEnabledFilters] = useState<ColumnFilterItem[]>([]);
    const [policiesManagementServiceList, setPoliciesManagementServiceList] = useState<Policy[]>([]);
    const listPoliciesManagementServiceQuery = useListPoliciesManagementServiceQuery();
    const [isOpenAddOrUpdatePolicyModal, setIsOpenAddOrUpdatePolicyModal] = useState<boolean>(false);

    const deletePoliciesManagementServiceRequest = useDeletePolicyRequest();

    useEffect(() => {
        if (!listPoliciesManagementServiceQuery.isSuccess) {
            return;
        }
        setCspFilters(updateCspFilters());
        setEnabledFilters(updateEnabledFilters());
        setPoliciesManagementServiceList(listPoliciesManagementServiceQuery.data);
    }, [listPoliciesManagementServiceQuery.isSuccess, listPoliciesManagementServiceQuery.data]);

    if (listPoliciesManagementServiceQuery.isError) {
        return <PoliciesManagementServiceListError error={listPoliciesManagementServiceQuery.error} />;
    }

    const columns: ColumnsType<Policy> = [
        {
            title: 'Policy ID',
            dataIndex: 'id',
        },
        {
            title: 'CSP',
            dataIndex: 'csp',
            filters: cspFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.csp.startsWith(value.toString()),
            render: (csp: AbstractCredentialInfo.csp, _) => {
                return (
                    <Space size='middle'>
                        <Image
                            width={100}
                            preview={false}
                            src={cspMap.get(csp.valueOf() as CloudServiceProvider.name)?.logo}
                        />
                    </Space>
                );
            },
        },
        {
            title: 'CreateOn',
            dataIndex: 'createTime',
            defaultSortOrder: 'descend',
            sorter: (a, b) => a.createTime.length - b.createTime.length,
            sortDirections: ['descend'],
        },
        {
            title: 'Enabled',
            dataIndex: 'enabled',
            filters: enabledFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.enabled === value,
            render: (text, _) => {
                return text ? 'true' : 'false';
            },
        },
        {
            title: 'Content',
            dataIndex: 'policy',
            render: (_text: string, record: Policy) => {
                return (
                    <Popover
                        content={
                            <pre>
                                {' '}
                                <div className={'policy-content-hover'}>{record.policy.toString()}</div>
                            </pre>
                        }
                        title={'Policy Content'}
                        trigger='hover'
                    >
                        <Button className={'policy-data-hover'} type={'link'}>{`Policy Content`}</Button>
                    </Popover>
                );
            },
        },
        {
            title: 'Operation',
            dataIndex: 'operation',
            render: (_text: string, record: Policy) => {
                return (
                    <>
                        <Space size='middle'>
                            <Button
                                type='primary'
                                icon={<EditOutlined />}
                                onClick={() => {
                                    updatePoliciesManagementService(record);
                                }}
                                disabled={
                                    id.length > 0 &&
                                    (deletePoliciesManagementServiceRequest.isPending ||
                                        deletePoliciesManagementServiceRequest.isSuccess ||
                                        deletePoliciesManagementServiceRequest.isError)
                                }
                            >
                                Update
                            </Button>
                            <Popconfirm
                                title='Delete the policy'
                                description='Are you sure to delete the policy?'
                                cancelText='Yes'
                                okText='No'
                                onCancel={() => {
                                    deleteCurrentPolicy(record);
                                }}
                            >
                                <Button
                                    type='primary'
                                    icon={<CloseCircleOutlined />}
                                    loading={
                                        record.id === id &&
                                        !deletePoliciesManagementServiceRequest.isSuccess &&
                                        deletePoliciesManagementServiceRequest.isError
                                    }
                                    disabled={
                                        id.length > 0 &&
                                        (deletePoliciesManagementServiceRequest.isPending ||
                                            deletePoliciesManagementServiceRequest.isSuccess ||
                                            deletePoliciesManagementServiceRequest.isError)
                                    }
                                >
                                    Delete
                                </Button>
                            </Popconfirm>
                        </Space>
                    </>
                );
            },
        },
    ];

    const deleteCurrentPolicy = (record: Policy) => {
        setId(record.id);
        deletePoliciesManagementServiceRequest.mutate(record.id);
    };

    const getDeleteCloseStatus = (isClose: boolean) => {
        if (isClose) {
            setId('');
            refreshPoliciesManagementServiceList();
        }
    };

    const refreshPoliciesManagementServiceList = () => {
        void listPoliciesManagementServiceQuery.refetch();
    };

    const addPoliciesManagementService = () => {
        setId('');
        setCurrentPolicyService(undefined);
        setIsOpenAddOrUpdatePolicyModal(true);
    };
    const closeAddOrUpdatePoliciesManagementServiceModal = () => {
        setIsOpenAddOrUpdatePolicyModal(false);
        refreshPoliciesManagementServiceList();
    };
    const updatePoliciesManagementService = (record: Policy) => {
        setCurrentPolicyService(record);
        setIsOpenAddOrUpdatePolicyModal(true);
    };

    const getCancelUpdateStatus = (isCancelled: boolean) => {
        if (isCancelled) {
            setIsOpenAddOrUpdatePolicyModal(false);
            refreshPoliciesManagementServiceList();
        }
    };

    return (
        <>
            <div className={'generic-table-container'}>
                {deletePoliciesManagementServiceRequest.isSuccess && id.length > 0 ? (
                    <PolicyDeleteResultStatus
                        id={id}
                        isError={deletePoliciesManagementServiceRequest.isError}
                        isSuccess={deletePoliciesManagementServiceRequest.isSuccess}
                        error={deletePoliciesManagementServiceRequest.error}
                        getDeleteCloseStatus={getDeleteCloseStatus}
                    />
                ) : null}
                <div className={'policy-manage-buttons-container'}>
                    <div className={'update-policy'}>
                        <Button
                            type='primary'
                            onClick={refreshPoliciesManagementServiceList}
                            icon={<SyncOutlined />}
                            disabled={
                                id.length > 0 &&
                                (deletePoliciesManagementServiceRequest.isPending ||
                                    deletePoliciesManagementServiceRequest.isSuccess ||
                                    deletePoliciesManagementServiceRequest.isError)
                            }
                        >
                            refresh
                        </Button>
                    </div>

                    <div className={'add-policy'}>
                        <Button
                            onClick={addPoliciesManagementService}
                            type='primary'
                            icon={<PlusCircleOutlined />}
                            disabled={
                                id.length > 0 &&
                                (deletePoliciesManagementServiceRequest.isPending ||
                                    deletePoliciesManagementServiceRequest.isSuccess ||
                                    deletePoliciesManagementServiceRequest.isError)
                            }
                        >
                            Add
                        </Button>
                    </div>
                </div>

                <Modal
                    title={currentPolicyService === undefined ? 'Add policy' : 'Update policy'}
                    width={1000}
                    footer={null}
                    open={isOpenAddOrUpdatePolicyModal}
                    destroyOnClose={true}
                    onCancel={closeAddOrUpdatePoliciesManagementServiceModal}
                >
                    <AddOrUpdatePolicy
                        currentPolicyService={currentPolicyService}
                        getCancelUpdateStatus={getCancelUpdateStatus}
                    />
                </Modal>
                <Table
                    columns={columns}
                    dataSource={policiesManagementServiceList}
                    rowKey={'id'}
                    loading={
                        listPoliciesManagementServiceQuery.isPending || listPoliciesManagementServiceQuery.isRefetching
                    }
                />
            </div>
        </>
    );
}

export default Policies;
