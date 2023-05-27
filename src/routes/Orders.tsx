import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { Button } from '@mui/material';
import { GridBaseColDef } from '@mui/x-data-grid/internals';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { appRequest } from '../api';
import { Urls } from '../api/Urls';
import { AppDataGrid } from '../components/shared/AppDataGrid';
import { RootBox } from '../components/shared/RootBox';
import SearchBar from '../components/shared/SearchBar';
import { getPrintableDate } from '../utils/utils';

import { Order } from 'um-types';

const PAGE_SIZE = 10;

export default function Orders() {
  const [data, setData] = useState<Order[]>([]);

  const [paginationModel, setPaginationModel] = useState({
    pageSize: PAGE_SIZE,
    page: 0,
  });

  const navigate = useNavigate();

  const onSearch = useCallback((searchValue: string) => {
    const id = Number(searchValue);

    if (isNaN(id)) {
      appRequest('get')(Urls.orderSearch(searchValue)).then((orders) => {
        if (Array.isArray(orders)) {
          setData(orders);
        } else {
          setData([]);
        }
      });
    } else {
      appRequest('get')(Urls.orderById(id))
        .then((order) => {
          if (order) {
            setData([order]);
          } else {
            setData([]);
          }
        })
        .catch((e) => {
          setData([]);
        });
    }
  }, []);

  const onClear = useCallback(() => {
    setPaginationModel({ page: 0, pageSize: PAGE_SIZE });
  }, []);

  const handleIdClick = useCallback(
    (id: any) => {
      navigate(`edit/${id}`);
    },
    [navigate],
  );

  useEffect(() => {
    appRequest('get')(Urls.orders(paginationModel.page + 1, paginationModel.pageSize)).then(setData);
  }, [paginationModel.page, paginationModel.pageSize]);

  const orderColumns: GridBaseColDef[] = useMemo(
    () => [
      {
        field: 'id',
        headerName: 'ID',
        type: 'number',
        renderCell: ({ row }) => {
          const { id } = row as Order;
          return (
            <Button startIcon={<EditOutlinedIcon />} onClick={() => handleIdClick(id)}>
              {id}
            </Button>
          );
        },
      },
      {
        field: 'rid',
        headerName: 'Auftrag',
      },
      {
        field: 'customer',
        flex: 1,
        headerName: 'Kunde',
        align: 'left',
        renderCell: ({ row }) => {
          const { customer } = row as Order;
          if (!customer) {
            return '';
          }
          if (customer.company) {
            return customer.company;
          }
          return `${customer.salutation || ''} ${customer.firstName || ''} ${customer.lastName || ''}`;
        },
      },
      {
        field: 'date',
        headerName: 'Datum',
        renderCell({ value }) {
          return getPrintableDate(value);
        },
      },
      {
        field: 'from',
        headerName: 'Auszugsadresse',
        align: 'left',
        flex: 1,
        renderCell: ({ row }) => {
          const { from } = row as Order;
          return from?.address || '';
        },
      },
      {
        field: 'ignore1',
        headerName: 'HVZ',
        width: 25,
        renderCell: ({ row }) => {
          const { from } = row as Order;

          return from?.parkingSlot ? <CheckOutlinedIcon color="success" /> : null;
        },
      },
      {
        field: 'to',
        headerName: 'Einzugsadresse',
        align: 'left',
        flex: 1,
        renderCell: ({ row }) => {
          const { to } = row as Order;
          return to?.address || '';
        },
      },
      {
        field: 'ignore2',
        headerName: 'HVZ',
        width: 25,
        renderCell: ({ row }) => {
          const { to } = row as Order;

          return to?.parkingSlot ? <CheckOutlinedIcon color="success" /> : null;
        },
      },
      {
        field: 'workersNumber',
        headerName: 'Mann',
        width: 60,
      },
      {
        field: 'timeBased',
        width: 80,
        headerName: 'Stunden',
        renderCell: ({ row }) => {
          const { timeBased } = row as Order;
          return timeBased?.hours || '';
        },
      },
      {
        field: 'transporterNumber',
        headerName: '3.5',
        width: 60,
      },
      {
        field: 't75',
        width: 60,
        headerName: '7.5',
      },
    ],
    [handleIdClick],
  );

  return (
    <RootBox>
      <SearchBar placeholder="Suche..." onClear={onClear} onSearch={onSearch} />
      <AppDataGrid
        data={data}
        columns={orderColumns}
        setPaginationModel={setPaginationModel}
        paginationModel={paginationModel}
      />
    </RootBox>
  );
}