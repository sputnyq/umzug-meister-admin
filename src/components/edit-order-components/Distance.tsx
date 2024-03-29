import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { useOption } from '../../hooks/useOption';
import { AppDispatch, AppState } from '../../store';
import { updateOrderProps } from '../../store/appReducer';
import { AppCard } from '../shared/AppCard';

import { Loader } from '@googlemaps/js-api-loader';
import { Order } from 'um-types';
import { clearCountry } from 'um-types/utils';

const represent = (distance = 0) => Number(distance / 1000).toFixed(0);

export default function Distance() {
  const gapiKey = useOption('gapikey');
  const origin = useOption('origin');

  const [response, setResponse] = useState<google.maps.DistanceMatrixResponse | null>();

  const loaderRef = useRef<Loader | null>(null);

  const dispatch = useDispatch<AppDispatch>();

  const order = useSelector<AppState, Order | null>((s) => s.app.current);
  const from = order?.from?.address;
  const to = order?.to?.address;

  useEffect(() => {
    if (loaderRef.current == null) {
      loaderRef.current = new Loader({
        apiKey: gapiKey,
        language: 'de',
      });
    }
    loaderRef.current
      .importLibrary('routes')
      .then((google) => {
        const service = new google.DistanceMatrixService();
        if (from && to) {
          service.getDistanceMatrix(
            {
              travelMode: google.TravelMode.DRIVING,
              origins: [origin, from, to],
              destinations: [from, to, origin],
            },
            setResponse,
          );
        }
      })
      .catch(console.log);
  }, [gapiKey, origin, from, to]);

  const sum = useMemo(() => {
    const sumInM = response?.rows.reduce(
      (result, row, index) => result + (row.elements[index].distance?.value || 0),
      0,
    );
    return represent(sumInM);
  }, [response]);

  const sx = useMemo(() => ({ fontWeight: 'bold' }), []);

  useEffect(() => {
    if (String(order?.distance) !== sum && sum !== '0') {
      dispatch(updateOrderProps({ path: ['distance'], value: sum }));
    }
  }, [dispatch, sum, order?.distance]);

  if (!gapiKey) {
    return null;
  }

  const RenderRow = (index: number, label: string) => {
    if (!response) {
      return null;
    }
    const { originAddresses, destinationAddresses, rows } = response;
    const elem = rows[index].elements[index];
    return (
      <TableRow>
        <TableCell sx={sx}>{label}</TableCell>
        <TableCell>{clearCountry(originAddresses[index])}</TableCell>
        <TableCell>{clearCountry(destinationAddresses[index])}</TableCell>
        <TableCell>{represent(elem.distance?.value)} km</TableCell>
        <TableCell>{elem.duration?.text}</TableCell>
      </TableRow>
    );
  };

  return (
    <AppCard title="Fahrstrecke">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell sx={sx}>Von</TableCell>
            <TableCell sx={sx}>Nach</TableCell>
            <TableCell sx={sx}>Strecke</TableCell>
            <TableCell sx={sx}>Fahrtzeit</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {RenderRow(0, 'Anfahrt')}
          {RenderRow(1, 'Lastfahrt')}
          {RenderRow(2, 'Rückfahrt')}
          <TableRow>
            <TableCell colSpan={3} sx={sx}>
              Gesamt
            </TableCell>

            <TableCell colSpan={2}>{sum} km</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </AppCard>
  );
}
