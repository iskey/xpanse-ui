/*
 * SPDX-License-Identifier: Apache-2.0
 * SPDX-FileCopyrightText: Huawei Inc.
 */

import React, { useEffect, useState } from 'react';
import { Button, Dropdown, Image, MenuProps, Modal, Popconfirm, Row, Space, Table, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { AbstractCredentialInfo, CloudServiceProvider, DeployedService } from '../../../../xpanse-api/generated';
import { ColumnFilterItem } from 'antd/es/table/interface';
import {
    CaretDownOutlined,
    CloseCircleOutlined,
    CopyOutlined,
    DeleteOutlined,
    FundOutlined,
    InfoCircleOutlined,
    SyncOutlined,
} from '@ant-design/icons';
import '../../../../styles/my_services.css';
import { sortVersionNum } from '../../../utils/Sort';
import { Migrate } from '../../order/migrate/Migrate';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrderFormStore } from '../../order/store/OrderFormStore';
import { PurgeServiceStatusPolling } from '../../order/purge/PurgeServiceStatusPolling';
import { usePurgeRequestSubmitQuery } from '../../order/purge/usePurgeRequestSubmitQuery';
import { useDestroyRequestSubmitQuery } from '../../order/destroy/useDestroyRequestSubmitQuery';
import DestroyServiceStatusPolling from '../../order/destroy/DestroyServiceStatusPolling';
import useListDeployedServicesQuery from './query/useListDeployedServicesQuery';
import { serviceIdQuery, serviceStateQuery } from '../../../utils/constants';
import { cspMap } from '../../common/csp/CspLogo';
import DeployedServicesError from '../common/DeployedServicesError';
import { DeployedServicesStatus } from '../common/DeployedServicesStatus';
import { DeployedServicesHostingType } from '../common/DeployedServicesHostingType';
import { MyServiceDetails } from './MyServiceDetails';

function MyServices(): React.JSX.Element {
    const [urlParams] = useSearchParams();
    const serviceIdInQuery = getServiceIdFormQuery();
    const serviceStateInQuery = getServiceStateFromQuery();
    const [serviceVoList, setServiceVoList] = useState<DeployedService[]>([]);
    const [versionFilters, setVersionFilters] = useState<ColumnFilterItem[]>([]);
    const [serviceHostingTypeFilters, setServiceHostingTypeFilters] = useState<ColumnFilterItem[]>([]);
    const [nameFilters, setNameFilters] = useState<ColumnFilterItem[]>([]);
    const [customerServiceNameFilters, setCustomerServiceNameFilters] = useState<ColumnFilterItem[]>([]);
    const [categoryFilters, setCategoryFilters] = useState<ColumnFilterItem[]>([]);
    const [cspFilters, setCspFilters] = useState<ColumnFilterItem[]>([]);
    const [serviceIdFilters, setServiceIdFilters] = useState<ColumnFilterItem[]>([]);
    const [serviceStateFilters, setServiceStateFilters] = useState<ColumnFilterItem[]>([]);
    const [id, setId] = useState<string>('');
    const [isDestroying, setIsDestroying] = useState<boolean>(false);
    const [isDestroyingCompleted, setIsDestroyingCompleted] = useState<boolean>(false);
    const [isPurging, setIsPurging] = useState<boolean>(false);
    const [isPurgingCompleted, setIsPurgingCompleted] = useState<boolean>(false);
    const [serviceIdInModal, setServiceIdInModal] = useState<string>('');
    const [serviceHostingType, setServiceHostingType] = useState<DeployedService.serviceHostingType>(
        DeployedService.serviceHostingType.SELF
    );
    const [currentServiceVo, setCurrentServiceVo] = useState<DeployedService | undefined>(undefined);
    const [isMyServiceDetailsModalOpen, setIsMyServiceDetailsModalOpen] = useState(false);
    const [title, setTitle] = useState<React.JSX.Element>(<></>);
    const [isMigrateModalOpen, setIsMigrateModalOpen] = useState<boolean>(false);
    const serviceDestroyQuery = useDestroyRequestSubmitQuery();
    const servicePurgeQuery = usePurgeRequestSubmitQuery();
    const [clearFormVariables] = useOrderFormStore((state) => [state.clearFormVariables]);

    const navigate = useNavigate();

    const listDeployedServicesQuery = useListDeployedServicesQuery();

    useEffect(() => {
        const serviceList: DeployedService[] = [];
        if (listDeployedServicesQuery.isSuccess && listDeployedServicesQuery.data.length > 0) {
            if (serviceStateInQuery) {
                setServiceVoList(
                    listDeployedServicesQuery.data.filter(
                        (serviceVo) => serviceVo.serviceDeploymentState === serviceStateInQuery
                    )
                );
            } else if (serviceIdInQuery) {
                setServiceVoList(
                    listDeployedServicesQuery.data.filter((serviceVo) => serviceVo.id === serviceIdInQuery)
                );
            } else {
                setServiceVoList(listDeployedServicesQuery.data);
            }
            updateServiceIdFilters(listDeployedServicesQuery.data);
            updateVersionFilters(listDeployedServicesQuery.data);
            updateNameFilters(listDeployedServicesQuery.data);
            updateCategoryFilters();
            updateCspFilters();
            updateServiceStateFilters();
            updateCustomerServiceNameFilters(listDeployedServicesQuery.data);
            updateServiceHostingFilters();
        } else {
            setServiceVoList(serviceList);
        }
    }, [listDeployedServicesQuery.data, listDeployedServicesQuery.isSuccess, serviceStateInQuery, serviceIdInQuery]);

    const getOperationMenu = (record: DeployedService): MenuProps['items'] => {
        return [
            {
                key: 'details',
                label: (
                    <Button
                        onClick={() => {
                            handleMyServiceDetailsOpenModal(record);
                        }}
                        className={'button-as-link'}
                        icon={<InfoCircleOutlined />}
                        type={'link'}
                    >
                        details
                    </Button>
                ),
            },
            {
                key: 'migrate',
                label: (
                    <Button
                        onClick={() => {
                            migrate(record);
                        }}
                        className={'button-as-link'}
                        icon={<CopyOutlined />}
                        disabled={
                            isDestroying ||
                            isPurging ||
                            record.serviceDeploymentState ===
                                DeployedService.serviceDeploymentState.DEPLOYMENT_FAILED ||
                            record.serviceDeploymentState ===
                                DeployedService.serviceDeploymentState.DESTROY_SUCCESSFUL ||
                            record.serviceDeploymentState === DeployedService.serviceDeploymentState.DEPLOYING ||
                            record.serviceDeploymentState === DeployedService.serviceDeploymentState.DESTROYING
                        }
                        type={'link'}
                    >
                        migrate
                    </Button>
                ),
            },
            {
                key:
                    record.serviceDeploymentState === DeployedService.serviceDeploymentState.DESTROY_SUCCESSFUL ||
                    record.serviceDeploymentState === DeployedService.serviceDeploymentState.DEPLOYMENT_FAILED
                        ? 'purge'
                        : 'destroy',
                disabled:
                    record.serviceDeploymentState === DeployedService.serviceDeploymentState.DESTROY_SUCCESSFUL ||
                    record.serviceDeploymentState === DeployedService.serviceDeploymentState.DEPLOYMENT_FAILED
                        ? isPurging || isDestroying || isPurgingCompleted
                        : (record.serviceDeploymentState !== DeployedService.serviceDeploymentState.DESTROY_FAILED &&
                              record.serviceDeploymentState !==
                                  DeployedService.serviceDeploymentState.DEPLOYMENT_SUCCESSFUL) ||
                          isDestroyingCompleted,
                label:
                    record.serviceDeploymentState === DeployedService.serviceDeploymentState.DESTROY_SUCCESSFUL ||
                    record.serviceDeploymentState === DeployedService.serviceDeploymentState.DEPLOYMENT_FAILED ? (
                        <Popconfirm
                            title='Purge the service'
                            description='Are you sure to purge the service?'
                            cancelText='Yes'
                            okText='No'
                            onCancel={() => {
                                purge(record);
                            }}
                        >
                            <Button icon={<DeleteOutlined />} className={'button-as-link'} type={'link'}>
                                purge
                            </Button>
                        </Popconfirm>
                    ) : (
                        <Popconfirm
                            title='Destroy the service'
                            description='Are you sure to destroy the service?'
                            cancelText='Yes'
                            okText='No'
                            onCancel={() => {
                                destroy(record);
                            }}
                        >
                            <Button icon={<CloseCircleOutlined />} className={'button-as-link'} type={'link'}>
                                destroy
                            </Button>
                        </Popconfirm>
                    ),
            },
        ];
    };

    if (listDeployedServicesQuery.isError) {
        return <DeployedServicesError error={listDeployedServicesQuery.error} />;
    }

    const getDestroyCloseStatus = (isClose: boolean) => {
        if (isClose) {
            setId('');
            setIsDestroying(false);
            refreshData();
        }
    };

    const getPurgeCloseStatus = (isClose: boolean) => {
        if (isClose) {
            setId('');
            setIsPurging(false);
            refreshData();
        }
    };

    const columns: ColumnsType<DeployedService> = [
        {
            title: 'Id',
            dataIndex: 'id',
            filters: serviceIdInQuery ? undefined : serviceIdFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.id.startsWith(value.toString()),
            filtered: !!serviceIdInQuery,
            align: 'center',
        },
        {
            title: 'Name',
            dataIndex: 'customerServiceName',
            filters: customerServiceNameFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => {
                if (record.customerServiceName !== undefined) {
                    const customerServiceName = record.customerServiceName;
                    return customerServiceName.startsWith(value.toString());
                }
                return false;
            },
            align: 'center',
        },
        {
            title: 'Category',
            dataIndex: 'category',
            filters: categoryFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.category.startsWith(value.toString()),
            align: 'center',
        },
        {
            title: 'Service',
            dataIndex: 'name',
            filters: nameFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.name.startsWith(value.toString()),
            align: 'center',
        },
        {
            title: 'Version',
            dataIndex: 'version',
            filters: versionFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.version.startsWith(value.toString()),
            sorter: (service1, service2) => sortVersionNum(service1.version, service2.version),
            align: 'center',
        },
        {
            title: 'ServiceHostedBy',
            dataIndex: 'serviceHostingType',
            filters: serviceHostingTypeFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) => record.serviceHostingType.startsWith(value.toString()),
            align: 'center',
            render: (serviceHostingType: DeployedService.serviceHostingType) =>
                DeployedServicesHostingType(serviceHostingType),
        },
        {
            title: 'Csp',
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
            align: 'center',
        },
        {
            title: 'Flavor',
            dataIndex: 'flavor',
            align: 'center',
        },
        {
            title: 'Created On',
            dataIndex: 'createTime',
            defaultSortOrder: 'descend',
            sorter: (serviceVoA, serviceVoB) => {
                const dateA = new Date(serviceVoA.createTime);
                const dateB = new Date(serviceVoB.createTime);
                return dateA.getTime() - dateB.getTime();
            },
            align: 'center',
        },
        {
            title: 'ServiceState',
            dataIndex: 'serviceDeploymentState',
            filters: serviceStateInQuery ? undefined : serviceStateFilters,
            filterMode: 'tree',
            filterSearch: true,
            onFilter: (value: React.Key | boolean, record) =>
                record.serviceDeploymentState.startsWith(value.toString()),
            render: (serviceState: DeployedService.serviceDeploymentState) => DeployedServicesStatus(serviceState),
            filtered: !!serviceStateInQuery,
            align: 'center',
        },
        {
            title: 'Monitor',
            dataIndex: 'monitor',
            align: 'center',
            render: (_, record) => {
                return (
                    <Tooltip title='Viewing Monitoring Indicators' placement='top'>
                        <Button
                            type='text'
                            onClick={() => {
                                onMonitor(record);
                            }}
                            disabled={
                                record.serviceDeploymentState !==
                                DeployedService.serviceDeploymentState.DEPLOYMENT_SUCCESSFUL
                            }
                        >
                            <FundOutlined />
                        </Button>
                    </Tooltip>
                );
            },
        },
        {
            title: 'Operation',
            dataIndex: 'operation',
            render: (_text: string, record: DeployedService) => {
                return (
                    <>
                        <Space size='middle'>
                            <Dropdown menu={{ items: getOperationMenu(record) }}>
                                <Button
                                    onClick={(e) => {
                                        e.preventDefault();
                                    }}
                                    type={'link'}
                                >
                                    <Space>
                                        More
                                        <CaretDownOutlined />
                                    </Space>
                                </Button>
                            </Dropdown>
                        </Space>
                    </>
                );
            },
            align: 'center',
        },
    ];

    const purge = (record: DeployedService): void => {
        setIsPurging(true);
        setServiceHostingType(record.serviceHostingType);
        setIsPurgingCompleted(false);
        setId(record.id);
        servicePurgeQuery.mutate(record.id);
    };

    function destroy(record: DeployedService): void {
        setIsDestroying(true);
        setIsDestroyingCompleted(false);
        setServiceHostingType(record.serviceHostingType);
        setId(record.id);
        serviceDestroyQuery.mutate(record.id);
    }

    function migrate(record: DeployedService): void {
        setCurrentServiceVo(record);
        setTitle(
            <div className={'generic-table-container'}>
                <div className={'content-title'}>
                    Service: {record.name}@{record.version}
                </div>
            </div>
        );
        setIsMigrateModalOpen(true);
    }

    function onMonitor(record: DeployedService): void {
        navigate('/monitor', {
            state: record,
        });
    }

    function updateServiceIdFilters(resp: DeployedService[]): void {
        const filters: ColumnFilterItem[] = [];
        const serviceIdSet = new Set<string>('');
        resp.forEach((v) => {
            serviceIdSet.add(v.id);
        });
        serviceIdSet.forEach((id) => {
            const filter = {
                text: id,
                value: id,
            };
            filters.push(filter);
        });
        setServiceIdFilters(filters);
    }

    function updateCspFilters(): void {
        const filters: ColumnFilterItem[] = [];
        Object.values(DeployedService.csp).forEach((csp) => {
            const filter = {
                text: csp,
                value: csp,
            };
            filters.push(filter);
        });
        setCspFilters(filters);
    }

    function updateServiceStateFilters(): void {
        const filters: ColumnFilterItem[] = [];
        Object.values(DeployedService.serviceDeploymentState).forEach((serviceStateItem) => {
            const filter = {
                text: serviceStateItem,
                value: serviceStateItem,
            };
            filters.push(filter);
        });
        setServiceStateFilters(filters);
    }

    function updateCategoryFilters(): void {
        const filters: ColumnFilterItem[] = [];
        Object.values(DeployedService.category).forEach((category) => {
            const filter = {
                text: category,
                value: category,
            };
            filters.push(filter);
        });
        setCategoryFilters(filters);
    }

    function updateVersionFilters(resp: DeployedService[]): void {
        const filters: ColumnFilterItem[] = [];
        const versionSet = new Set<string>('');
        resp.forEach((v) => {
            versionSet.add(v.version);
        });
        versionSet.forEach((version) => {
            const filter = {
                text: version,
                value: version,
            };
            filters.push(filter);
        });
        setVersionFilters(filters);
    }

    function updateNameFilters(resp: DeployedService[]): void {
        const filters: ColumnFilterItem[] = [];
        const nameSet = new Set<string>('');
        resp.forEach((v) => {
            nameSet.add(v.name);
        });
        nameSet.forEach((name) => {
            const filter = {
                text: name,
                value: name,
            };
            filters.push(filter);
        });
        setNameFilters(filters);
    }

    function updateCustomerServiceNameFilters(resp: DeployedService[]): void {
        const filters: ColumnFilterItem[] = [];
        const customerServiceNameSet = new Set<string>('');
        resp.forEach((v) => {
            if (v.customerServiceName) {
                customerServiceNameSet.add(v.customerServiceName);
            }
        });
        customerServiceNameSet.forEach((name) => {
            const filter = {
                text: name,
                value: name,
            };
            filters.push(filter);
        });
        setCustomerServiceNameFilters(filters);
    }

    function updateServiceHostingFilters(): void {
        const filters: ColumnFilterItem[] = [];
        Object.values(DeployedService.serviceHostingType).forEach((serviceHostingType) => {
            const filter = {
                text: serviceHostingType,
                value: serviceHostingType,
            };
            filters.push(filter);
        });
        setServiceHostingTypeFilters(filters);
    }

    function refreshData(): void {
        clearFormVariables();
        void listDeployedServicesQuery.refetch();
    }

    const handleMyServiceDetailsOpenModal = (serviceVo: DeployedService) => {
        setServiceIdInModal(serviceVo.id);
        setServiceHostingType(serviceVo.serviceHostingType);
        setIsMyServiceDetailsModalOpen(true);
    };

    const handleMyServiceDetailsModalClose = () => {
        setServiceIdInModal('');
        setIsMyServiceDetailsModalOpen(false);
    };

    const handleCancelMigrateModel = () => {
        clearFormVariables();
        refreshData();
        setCurrentServiceVo(undefined);
        setIsMigrateModalOpen(false);
    };

    function getServiceStateFromQuery(): DeployedService.serviceDeploymentState | undefined {
        const queryInUri = decodeURI(urlParams.get(serviceStateQuery) ?? '');
        if (queryInUri.length > 0) {
            if (
                Object.values(DeployedService.serviceDeploymentState).includes(
                    queryInUri as DeployedService.serviceDeploymentState
                )
            ) {
                return queryInUri as DeployedService.serviceDeploymentState;
            }
        }
        return undefined;
    }

    function getServiceIdFormQuery(): string | undefined {
        const queryInUri = decodeURI(urlParams.get(serviceIdQuery) ?? '');
        if (queryInUri.length > 0) {
            return queryInUri;
        }
        return undefined;
    }

    return (
        <div className={'generic-table-container'}>
            {serviceDestroyQuery.isSuccess && isDestroying && id.length > 0 ? (
                <DestroyServiceStatusPolling
                    uuid={id}
                    isError={serviceDestroyQuery.isError}
                    isSuccess={serviceDestroyQuery.isSuccess}
                    error={serviceDestroyQuery.error}
                    setIsDestroyingCompleted={setIsDestroyingCompleted}
                    getDestroyCloseStatus={getDestroyCloseStatus}
                    serviceHostingType={serviceHostingType}
                />
            ) : null}
            {isPurging && id.length > 0 ? (
                <PurgeServiceStatusPolling
                    uuid={id}
                    isError={servicePurgeQuery.isError}
                    error={servicePurgeQuery.error}
                    setIsPurgingCompleted={setIsPurgingCompleted}
                    getPurgeCloseStatus={getPurgeCloseStatus}
                    serviceHostingType={serviceHostingType}
                />
            ) : null}
            <Modal
                title={'Service Details'}
                width={1000}
                footer={null}
                open={serviceIdInModal.length > 0 && isMyServiceDetailsModalOpen}
                onCancel={handleMyServiceDetailsModalClose}
            >
                <MyServiceDetails serviceId={serviceIdInModal} serviceHostingType={serviceHostingType} />
            </Modal>
            {currentServiceVo ? (
                <Modal
                    open={isMigrateModalOpen}
                    title={title}
                    closable={true}
                    maskClosable={false}
                    destroyOnClose={true}
                    footer={null}
                    onCancel={handleCancelMigrateModel}
                    width={1400}
                    mask={true}
                >
                    <Migrate currentSelectedService={currentServiceVo} />
                </Modal>
            ) : null}

            <div>
                <Button
                    disabled={isDestroying}
                    type='primary'
                    icon={<SyncOutlined />}
                    onClick={() => {
                        refreshData();
                    }}
                >
                    refresh
                </Button>
            </div>
            <Row>
                <div className={'service-instance-list'}>
                    <Table
                        columns={columns}
                        dataSource={serviceVoList}
                        loading={listDeployedServicesQuery.isPending || listDeployedServicesQuery.isRefetching}
                        rowKey={'id'}
                    />
                </div>
            </Row>
        </div>
    );
}

export default MyServices;
