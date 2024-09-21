import React from 'react';
import PropTypes from 'prop-types';
import { useQuery, gql } from "@apollo/client";
import LocalDate from '../util/LocalDate';
import DataError from './dataError';
import EmptyContent from './emptyContent';


var GET_DATA = gql`query ($nodeIds: [String]!, $period: BigInt!) {
  customers(idList: $nodeIds) {
    id
    fullName
  }
  compensationPlans {
    periods(at: $period) {
      id
      begin
      end
      status
      bonuses(nodeIds: $nodeIds) {
        bonusId
        nodeId
        amount
        bonusTitle
        description
        level
        rank
        released
        percent
        commissionDate
        volume
      } 
    }
    ranks{
      id
      name
    }
  }
}`;

const EarningsTable = ({ customerId, periodId, overrides }) => {
  const { data, loading, error } = useQuery(GET_DATA, {
    variables: { nodeIds: [customerId], period: parseInt(periodId) },
  });

  if (loading) return <></>;
  if (error) return <DataError error={error} />

  var plan = data?.compensationPlans.find(item =>
    item.periods.some(subItem => subItem.bonuses)
  ) || null;

  let ranks = plan?.ranks;
  let bonuses = [];
  if (plan?.periods[0]?.bonuses) {
    bonuses = [...plan.periods[0].bonuses];
    bonuses.sort((a, b) => (a.bonusId > b.bonusId) ? 1 : -1);
  }

  const hasBonuses = true; //bonuses.length > 0;

  return <>
    {!hasBonuses && <>
      <EmptyContent title='Bonuses not found' text="No bonuses found for the selected period" />
    </>}
    {hasBonuses && <div className="table-responsive">
      <table className="table card-table table-vcenter text-nowrap datatable">
        <thead>
          <tr>
            <th>Date</th>
            <th>Bonus Name</th>
            <th>Level</th>
            <th>Amount</th>
            <th>Percent</th>
            <th>Volume</th>
            <th>Released</th>
            <th>Rank</th>
          </tr>
        </thead>
        <tbody>
          {bonuses.map((bonus) => {
            var override = overrides?.find(o => o.title == bonus.bonusTitle) ?? { title: bonus.bonusTitle, display: bonus.bonusTitle, show: true }
            if (!override.show) return <tr key={bonus.bonusId}></tr>

            return <tr key={bonus.bonusId}>
              <td><LocalDate dateString={bonus.commissionDate} hideTime={true} /></td>
              <td>
                <a className="text-reset" href={`/customers/${customerId}/commissions/${bonus.bonusId}?periodId=${periodId}`}>{override.display}</a>
              </td>
              <td>{bonus.level}</td>
              <td>{bonus.amount.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
              <td>{bonus.percent}</td>
              <td>
                <a className="text-reset" href={`/customers/${customerId}/commissions/${bonus.bonusId}?periodId=${periodId}`}>{bonus.volume}</a>
              </td>
              <td>{bonus.released.toLocaleString("en-US", { style: 'currency', currency: bonus?.currency ?? 'USD' })}</td>
              <td>{ranks.find(r => r.id == bonus.rank)?.name}</td>
            </tr>
          })}
          {(() => {
            const totalAmount = bonuses.reduce((acc, bonus) => acc + bonus.amount, 0);
            const totalVolume = bonuses.reduce((acc, bonus) => acc + bonus.volume, 0);
            const totalReleased = bonuses.reduce((acc, bonus) => acc + bonus.released, 0);

            return (
              <tr className="table-light">
                <td className="strong">Total</td>
                <td></td>
                <td></td>
                <td className="strong">{totalAmount.toLocaleString("en-US", { style: 'currency', currency: bonuses[0]?.currency ?? 'USD' })}</td>
                <td></td>
                <td className="strong">{totalVolume}</td>
                <td className="strong">{totalReleased.toLocaleString("en-US", { style: 'currency', currency: bonuses[0]?.currency ?? 'USD' })}</td>
                <td></td>
              </tr>
            );
          })()}
        </tbody>
      </table>
    </div>}
  </>
}

export default EarningsTable;

EarningsTable.propTypes = {
  customerId: PropTypes.string.isRequired,
  periodId: PropTypes.number,
  overrides: PropTypes.array
}