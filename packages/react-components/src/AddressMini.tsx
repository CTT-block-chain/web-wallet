// Copyright 2017-2020 @polkadot/app-staking authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountId, AccountIndex, Address } from '@polkadot/types/interfaces';

import BN from 'bn.js';
import React from 'react';
import styled from 'styled-components';
import { KeyringItemType } from '@polkadot/ui-keyring/types';

import { classes, toShortAddress } from './util';
import AccountName from './AccountName';
import BalanceDisplay from './Balance';
import BondedDisplay from './Bonded';
import IdentityIcon from './IdentityIcon';
import LockedVote from './LockedVote';
import { useCall, useApi} from '@polkadot/react-hooks';
import Label from './Label';

interface Props {
  intoType?: string;
  balance?: BN | BN[];
  bonded?: BN | BN[];
  children?: React.ReactNode;
  className?: string;
  iconInfo?: React.ReactNode;
  isHighlight?: boolean;
  isPadded?: boolean;
  isShort?: boolean;
  label?: React.ReactNode;
  labelBalance?: React.ReactNode;
  summary?: React.ReactNode;
  type?: KeyringItemType;
  value?: AccountId | AccountIndex | Address | string | null | Uint8Array;
  value2?: AccountId | AccountIndex | Address | string | null | Uint8Array;
  withAddress?: boolean;
  withBalance?: boolean;
  withBonded?: boolean;
  withLockedVote?: boolean;
  withSidebar?: boolean;
  withName?: boolean;
  withShrink?: boolean;
}

function AddressMini ({ intoType = '', balance, bonded, children, className = '', iconInfo, isHighlight, isPadded = true, label, labelBalance, summary, value, value2, withAddress = true, withBalance = false, withBonded = false, withLockedVote = false, withName = true, withShrink = false, withSidebar = true }: Props): React.ReactElement<Props> | null {
  const { api } = useApi();
  if (!value) {
    return null;
  }

  if(!!value && !!intoType && intoType=='StakeOther'){
    console.log("value:"+value);
    var powerRatio = useCall<string>(api.derive.kp.powerRatio, [value+'']);
    console.log("powerRatio:"+powerRatio);
    var newBonded = new BN(0);
    if(!!powerRatio){
      newBonded = new BN((bonded+'')).idivn(Number(powerRatio));
    }
    console.log("newBonded:"+newBonded);

    return (
      <div className={classes('ui--AddressMini', isHighlight ? 'isHighlight' : '', isPadded ? 'padded' : '', withShrink ? 'withShrink' : '', className)}>
        {label && (
          <label className='ui--AddressMini-label'>{label}</label>
        )}
        <div className='ui--AddressMini-icon'>
          <IdentityIcon value={value as Uint8Array} />
          {iconInfo && (
            <div className='ui--AddressMini-icon-info'>
              {iconInfo}
            </div>
          )}
        </div>
        <div className='ui--AddressMini-info'>
          {withAddress && (
            <div className='ui--AddressMini-address'>
              {withName
                ? (
                  <AccountName
                    value={value}
                    withSidebar={withSidebar}
                  />
                )
                : toShortAddress(value)
              }
            </div>
          )}
          {children}
        </div>
        <div className='ui--AddressMini-balances' style={{display:'flex',flexDirection:'row'}}>
          {withBalance && (
            <BalanceDisplay
              balance={balance}
              label={labelBalance}
              params={value}
            />
          )}
          {withBonded && <div className='ui--Bonded' style={{alignItems:'flex-end'}}><Label label={powerRatio?(parseFloat(powerRatio+'').toFixed(2))+'x-':''} /></div>}
          {withBonded && (
            <BondedDisplay
              bonded={newBonded}
              label=''
              params={value}
            />
          )}
          {withLockedVote && (
            <LockedVote params={value} />
          )}
          {summary && (
            <div className='ui--AddressMini-summary'>{summary}</div>
          )}
        </div>
      </div>
    );

 }else if(!!value2 && !!intoType && intoType=='ActiveNominations'){
   console.log("value2:"+value2);
   var powerRatio = useCall<string>(api.derive.kp.powerRatio, [value2+'']);
   console.log("powerRatio:"+powerRatio);
   var newBalance = new BN(0);
   if(!!powerRatio && !!balance){
     newBalance = new BN((balance+'')).idivn(Number(powerRatio));
   }
   console.log("newBalance:"+newBalance);

   return (
     <div className={classes('ui--AddressMini', isHighlight ? 'isHighlight' : '', isPadded ? 'padded' : '', withShrink ? 'withShrink' : '', className)}>
       {label && (
         <label className='ui--AddressMini-label'>{label}</label>
       )}
       <div className='ui--AddressMini-icon'>
         <IdentityIcon value={value as Uint8Array} />
         {iconInfo && (
           <div className='ui--AddressMini-icon-info'>
             {iconInfo}
           </div>
         )}
       </div>
       <div className='ui--AddressMini-info'>
         {withAddress && (
           <div className='ui--AddressMini-address'>
             {withName
               ? (
                 <AccountName
                   value={value}
                   withSidebar={withSidebar}
                 />
               )
               : toShortAddress(value)
             }
           </div>
         )}
         {children}
       </div>
       <div className='ui--AddressMini-balances' style={{display:'flex',flexDirection:'row'}}>
         {withBalance && <div className='ui--Bonded' style={{alignItems:'flex-end'}}><Label label={powerRatio?(parseFloat(powerRatio+'').toFixed(2))+'x-':''} /></div>}
         {withBalance && (
           <BalanceDisplay
             balance={newBalance}
             label={labelBalance}
             params={value}
           />
         )}

         {withBonded && (
           <BondedDisplay
             bonded={bonded}
             label=''
             params={value}
           />
         )}
         {withLockedVote && (
           <LockedVote params={value} />
         )}
         {summary && (
           <div className='ui--AddressMini-summary'>{summary}</div>
         )}
       </div>
     </div>
   );


 }else if(!!value && !!intoType && intoType=='ReferendumVote'){
   const FLOAT_BASE = 10000;
   var powerRatio = useCall<string>(api.derive.kp.powerRatio, [value+'']);
   var newBalance = new BN(0);
   if (balance && powerRatio) {
     newBalance = balance.muln(Math.floor(Number(powerRatio) * FLOAT_BASE)).divn(FLOAT_BASE);
   }

   return (
     <div className={classes('ui--AddressMini', isHighlight ? 'isHighlight' : '', isPadded ? 'padded' : '', withShrink ? 'withShrink' : '', className)}>
       {label && (
         <label className='ui--AddressMini-label'>{label}</label>
       )}
       <div className='ui--AddressMini-icon'>
         <IdentityIcon value={value as Uint8Array} />
         {iconInfo && (
           <div className='ui--AddressMini-icon-info'>
             {iconInfo}
           </div>
         )}
       </div>
       <div className='ui--AddressMini-info'>
         {withAddress && (
           <div className='ui--AddressMini-address'>
             {withName
               ? (
                 <AccountName
                   value={value}
                   withSidebar={withSidebar}
                 />
               )
               : toShortAddress(value)
             }
           </div>
         )}
         {children}
       </div>
       <div className='ui--AddressMini-balances' style={{display:'flex',flexDirection:'row'}}>
         {withBalance && <div className='ui--Bonded' style={{alignItems:'flex-end'}}><Label label={powerRatio?(parseFloat(powerRatio+'').toFixed(2))+'x-':''} /></div>}
         {withBalance && (
           <BalanceDisplay
             balance={newBalance}
             label={labelBalance}
             params={value}
           />
         )}

         {withBonded && (
           <BondedDisplay
             bonded={bonded}
             label=''
             params={value}
           />
         )}
         {withLockedVote && (
           <LockedVote params={value} />
         )}
         {summary && (
           <div className='ui--AddressMini-summary'>{summary}</div>
         )}
       </div>
     </div>
   );







 }else if(!!value && !!intoType && intoType=='Voters'){
   var powerRatio = useCall<string>(api.derive.kp.powerRatio, [value+'']);
   return (
     <div className={classes('ui--AddressMini', isHighlight ? 'isHighlight' : '', isPadded ? 'padded' : '', withShrink ? 'withShrink' : '', className)}>
       {label && (
         <label className='ui--AddressMini-label'>{label}</label>
       )}
       <div className='ui--AddressMini-icon'>
         <IdentityIcon value={value as Uint8Array} />
         {iconInfo && (
           <div className='ui--AddressMini-icon-info'>
             {iconInfo}
           </div>
         )}
       </div>
       <div className='ui--AddressMini-info'>
         {withAddress && (
           <div className='ui--AddressMini-address'>
             {withName
               ? (
                 <AccountName
                   value={value}
                   withSidebar={withSidebar}
                 />
               )
               : toShortAddress(value)
             }
           </div>
         )}
         {children}
       </div>
       <div className='ui--AddressMini-balances' style={{display:'flex',flexDirection:'row'}}>
         {withBalance && <div className='ui--Bonded' style={{alignItems:'flex-end'}}><Label label={powerRatio?(parseFloat(powerRatio+'').toFixed(2))+'x-':''} /></div>}
         {withBalance && (
           <BalanceDisplay
             balance={balance}
             label={labelBalance}
             params={value}
           />
         )}

         {withBonded && (
           <BondedDisplay
             bonded={bonded}
             label=''
             params={value}
           />
         )}
         {withLockedVote && (
           <LockedVote params={value} intoType={intoType} powerRatio={powerRatio}/>
         )}
         {summary && (
           <div className='ui--AddressMini-summary'>{summary}</div>
         )}
       </div>
     </div>
   );

 }else{

    return (
      <div className={classes('ui--AddressMini', isHighlight ? 'isHighlight' : '', isPadded ? 'padded' : '', withShrink ? 'withShrink' : '', className)}>
        {label && (
          <label className='ui--AddressMini-label'>{label}</label>
        )}
        <div className='ui--AddressMini-icon'>
          <IdentityIcon value={value as Uint8Array} />
          {iconInfo && (
            <div className='ui--AddressMini-icon-info'>
              {iconInfo}
            </div>
          )}
        </div>
        <div className='ui--AddressMini-info'>
          {withAddress && (
            <div className='ui--AddressMini-address'>
              {withName
                ? (
                  <AccountName
                    value={value}
                    withSidebar={withSidebar}
                  />
                )
                : toShortAddress(value)
              }
            </div>
          )}
          {children}
        </div>
        <div className='ui--AddressMini-balances'>
          {withBalance && (
            <BalanceDisplay
              balance={balance}
              label={labelBalance}
              params={value}
            />
          )}
          {withBonded && (
            <BondedDisplay
              bonded={bonded}
              label=''
              params={value}
            />
          )}
          {withLockedVote && (
            <LockedVote params={value} />
          )}
          {summary && (
            <div className='ui--AddressMini-summary'>{summary}</div>
          )}
        </div>
      </div>
    );

  }
}

export default React.memo(styled(AddressMini)`
  display: inline-block;
  padding: 0 0.25rem 0 1rem;
  text-align: left;
  white-space: nowrap;

  &.padded {
    display: inline-block;
    padding: 0 1rem 0 0;
  }

  &.summary {
    position: relative;
    top: -0.2rem;
  }

  .ui--AddressMini-info {
    max-width: 12rem;
    min-width: 12rem;

    @media only screen and (max-width: 1800px) {
      max-width: 11.5rem;
      min-width: 11.5rem;
    }

    @media only screen and (max-width: 1700px) {
      max-width: 11rem;
      min-width: 11rem;
    }

    @media only screen and (max-width: 1600px) {
      max-width: 10.5rem;
      min-width: 10.5rem;
    }

    @media only screen and (max-width: 1500px) {
      max-width: 10rem;
      min-width: 10rem;
    }

    @media only screen and (max-width: 1400px) {
      max-width: 9.5rem;
      min-width: 9.5rem;
    }

    @media only screen and (max-width: 1300px) {
      max-width: 9rem;
      min-width: 9rem;
    }
  }

  .ui--AddressMini-address {
    overflow: hidden;
    text-align: left;
    text-overflow: ellipsis;
    width: fit-content;
    max-width: inherit;

    > div {
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  &.withShrink {
    .ui--AddressMini-address {
      min-width: 3rem;
    }
  }

  .ui--AddressMini-label {
    margin: 0 0 -0.5rem 2.25rem;
  }

  .ui--AddressMini-balances {
    display: grid;

    .ui--Balance,
    .ui--Bonded,
    .ui--LockedVote {
      font-size: 0.75rem;
      margin-left: 0.25rem;
      margin-top: -0.5rem;
      text-align: left;
    }
  }

  .ui--AddressMini-icon {
    margin: 0 0.5rem 0 0;

    .ui--AddressMini-icon-info {
      position: absolute;
      right: -0.5rem;
      top: -0.5rem;
      z-index: 1;
    }

    .ui--IdentityIcon {
      margin: 0;
      vertical-align: middle;
    }
  }

  .ui--AddressMini-icon,
  .ui--AddressMini-info {
    display: inline-block;
    position: relative;
    vertical-align: middle;
  }

  .ui--AddressMini-summary {
    font-size: 0.75rem;
    line-height: 1.2;
    margin-left: 2.25rem;
    margin-top: -0.2rem;
    text-align: left;
  }
`);
