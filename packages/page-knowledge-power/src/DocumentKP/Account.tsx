// Copyright 2017-2020 @polkadot/app-accounts authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { DeriveAccountPowers } from '@polkadot/api-derive/types';

import { FormatKP } from '@polkadot/react-query';
import { SubmittableExtrinsic } from '@polkadot/api/types';
import { DeriveBalancesAll, DeriveDemocracyLock } from '@polkadot/api-derive/types';
import { ActionStatus } from '@polkadot/react-components/Status/types';
import { ThemeDef } from '@polkadot/react-components/types';
import { ProxyDefinition, RecoveryConfig } from '@polkadot/types/interfaces';
import { KeyringAddress } from '@polkadot/ui-keyring/types';
import { Delegation } from '../types';

import BN from 'bn.js';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';
import { ApiPromise } from '@polkadot/api';
import { getLedger } from '@polkadot/react-api';
import { AddressInfo, AddressMini, AddressSmall, Badge, Button, ChainLock, CryptoType, Forget, Icon, IdentityIcon, LinkExternal, Menu, Popup, StatusContext, Tags } from '@polkadot/react-components';
import { useAccountInfo, useApi, useCall, useToggle } from '@polkadot/react-hooks';
import { Option } from '@polkadot/types';
import keyring from '@polkadot/ui-keyring';
import { BN_ZERO, formatBalance, formatNumber } from '@polkadot/util';

import { useTranslation } from '../translate';
import { createMenuGroup } from '../util';
import Backup from '../modals/Backup';
import ChangePass from '../modals/ChangePass';
import DelegateModal from '../modals/Delegate';
import Derive from '../modals/Derive';
import IdentityMain from '../modals/IdentityMain';
import IdentitySub from '../modals/IdentitySub';
import ProxyOverview from '../modals/ProxyOverview';
import MultisigApprove from '../modals/MultisigApprove';
import RecoverAccount from '../modals/RecoverAccount';
import RecoverSetup from '../modals/RecoverSetup';
import Transfer from '../modals/Transfer';
import UndelegateModal from '../modals/Undelegate';
import useMultisigApprovals from './useMultisigApprovals';
import useProxies from './useProxies';

interface Props {
  appId?: string;
  account: KeyringAddress;
  className?: string;
  delegation?: Delegation;
  filter: string;
  isFavorite: boolean;
  proxy?: [ProxyDefinition[], BN];
  setBalance: (address: string, value: BN) => void;
  toggleFavorite: (address: string) => void;
}

interface DemocracyUnlockable {
  democracyUnlockTx: SubmittableExtrinsic<'promise'> | null;
  ids: BN[];
}

function calcVisible (filter: string, name: string, tags: string[]): boolean {
  if (filter.length === 0) {
    return true;
  }

  const _filter = filter.toLowerCase();

  return tags.reduce((result: boolean, tag: string): boolean => {
    return result || tag.toLowerCase().includes(_filter);
  }, name.toLowerCase().includes(_filter));
}

function createClearDemocracyTx (api: ApiPromise, address: string, unlockableIds: BN[]): SubmittableExtrinsic<'promise'> {
  return api.tx.utility.batch(
    unlockableIds
      .map((id) => api.tx.democracy.removeVote(id))
      .concat(api.tx.democracy.unlock(address))
  );
}

const transformRecovery = {
  transform: (opt: Option<RecoveryConfig>) => opt.unwrapOr(null)
};

function Account ({ appId = '', account: { address, meta }, className = '', delegation, filter, isFavorite, proxy, setBalance, toggleFavorite }: Props): React.ReactElement<Props> | null {
  const { t } = useTranslation();
  const { theme } = useContext<ThemeDef>(ThemeContext);
  const { queueExtrinsic } = useContext(StatusContext);
  const api = useApi();
  const bestNumber = useCall<BN>(api.api.derive.chain.bestNumber);
  const balancesAll = useCall<DeriveBalancesAll>(api.api.derive.balances.all, [address]);
  const democracyLocks = useCall<DeriveDemocracyLock[]>(api.api.derive.democracy?.locks, [address]);
  const recoveryInfo = useCall<RecoveryConfig | null>(api.api.query.recovery?.recoverable, [address], transformRecovery);
  const multiInfos = useMultisigApprovals(address);
  const proxyInfo = useProxies(address);
  const { flags: { isDevelopment, isExternal, isHardware, isInjected, isMultisig, isProxied }, genesisHash, identity, name: accName, onSetGenesisHash, tags } = useAccountInfo(address);
  const [{ democracyUnlockTx }, setUnlockableIds] = useState<DemocracyUnlockable>({ democracyUnlockTx: null, ids: [] });
  const [vestingVestTx, setVestingTx] = useState<SubmittableExtrinsic<'promise'> | null>(null);
  const [isBackupOpen, toggleBackup] = useToggle();
  const [isDeriveOpen, toggleDerive] = useToggle();
  const [isForgetOpen, toggleForget] = useToggle();
  const [isIdentityMainOpen, toggleIdentityMain] = useToggle();
  const [isIdentitySubOpen, toggleIdentitySub] = useToggle();
  const [isMultisigOpen, toggleMultisig] = useToggle();
  const [isProxyOverviewOpen, toggleProxyOverview] = useToggle();
  const [isPasswordOpen, togglePassword] = useToggle();
  const [isRecoverAccountOpen, toggleRecoverAccount] = useToggle();
  const [isRecoverSetupOpen, toggleRecoverSetup] = useToggle();
  const [isSettingsOpen, toggleSettings] = useToggle();
  const [isTransferOpen, toggleTransfer] = useToggle();
  const [isDelegateOpen, toggleDelegate] = useToggle();
  const [isUndelegateOpen, toggleUndelegate] = useToggle();

  useEffect((): void => {
    if (balancesAll) {
      setBalance(address, balancesAll.freeBalance.add(balancesAll.reservedBalance));

      api.api.tx.vesting?.vest && setVestingTx(() =>
        balancesAll.vestingLocked.isZero()
          ? null
          : api.api.tx.vesting.vest()
      );
    }
  }, [address, api, balancesAll, setBalance]);

  useEffect((): void => {
    bestNumber && democracyLocks && setUnlockableIds(
      (prev): DemocracyUnlockable => {
        const ids = democracyLocks
          .filter(({ isFinished, unlockAt }) => isFinished && bestNumber.gt(unlockAt))
          .map(({ referendumId }) => referendumId);

        if (JSON.stringify(prev.ids) === JSON.stringify(ids)) {
          return prev;
        }

        return {
          democracyUnlockTx: createClearDemocracyTx(api.api, address, ids),
          ids
        };
      }
    );
  }, [address, api, bestNumber, democracyLocks]);

  const isVisible = useMemo(
    () => calcVisible(filter, accName, tags),
    [accName, filter, tags]
  );

  const _onFavorite = useCallback(
    () => toggleFavorite(address),
    [address, toggleFavorite]
  );

  const _onForget = useCallback(
    (): void => {
      if (!address) {
        return;
      }

      const status: Partial<ActionStatus> = {
        account: address,
        action: 'forget'
      };

      try {
        keyring.forgetAccount(address);
        status.status = 'success';
        status.message = t<string>('account forgotten');
      } catch (error) {
        status.status = 'error';
        status.message = (error as Error).message;
      }
    },
    [address, t]
  );

  const _clearDemocracyLocks = useCallback(
    () => democracyUnlockTx && queueExtrinsic({
      accountId: address,
      extrinsic: democracyUnlockTx
    }),
    [address, democracyUnlockTx, queueExtrinsic]
  );

  const _vestingVest = useCallback(
    () => vestingVestTx && queueExtrinsic({
      accountId: address,
      extrinsic: vestingVestTx
    }),
    [address, queueExtrinsic, vestingVestTx]
  );

  const _showOnHardware = useCallback(
    // TODO: we should check the hardwareType from metadata here as well,
    // for now we are always assuming hardwareType === 'ledger'
    (): void => {
      getLedger()
        .getAddress(true, meta.accountOffset as number || 0, meta.addressOffset as number || 0)
        .catch((error): void => {
          console.error(`ledger: ${(error as Error).message}`);
        });
    },
    [meta]
  );

  if (!isVisible) {
    return null;
  }
 const testValue2='正常';

 //console.log("account:"+address);
 const docPowers = useCall<DeriveDocumentPower[]>(
     api.api.derive.kp.accountDocuments, [address, appId]
 );
 if(!!docPowers){
   //console.log("docPowers:"+JSON.stringify(docPowers));
 }
 let a: Number = 0;
 if(!!docPowers&&docPowers.length>0){
   for(a=0; a<docPowers.length; a++){
     //console.log("docPowers[a].power:"+docPowers[a].power);
     let docType: String = "";
     if(docPowers[a].documentType==0){
       docType="参数发布";
     }else if(docPowers[a].documentType==1){
       docType="鉴别";
     }else if(docPowers[a].documentType==2){
       docType="品鉴";
     }else if(docPowers[a].documentType==3){
       docType="选品";
     }else if(docPowers[a].documentType==4){
       docType="模型创建";
     }
      let power: string = '';
      if(docPowers[a].power!=0){
        power=parseFloat(Number(docPowers[a].power)/100.00).toFixed(4).toString()
      }else{
        power='0.0000'
      }
     return (
       <tr className={className}>
         <td className='favorite'>
           <Icon
             color={isFavorite ? 'orange' : 'gray'}
             icon='star'
             onClick={_onFavorite}
           />
         </td>
         <td className='address'>
           {docPowers[a].documentId}
         </td>

         <td className='address'>
           <AddressSmall value={address} />
           {isBackupOpen && (
             <Backup
               address={address}
               key='modal-backup-account'
               onClose={toggleBackup}
             />
           )}
           {isDelegateOpen && (
             <DelegateModal
               key='modal-delegate'
               onClose={toggleDelegate}
               previousAmount={delegation?.amount}
               previousConviction={delegation?.conviction}
               previousDelegatedAccount={delegation?.accountDelegated}
               previousDelegatingAccount={address}
             />
           )}
           {isDeriveOpen && (
             <Derive
               from={address}
               key='modal-derive-account'
               onClose={toggleDerive}
             />
           )}
           {isForgetOpen && (
             <Forget
               address={address}
               key='modal-forget-account'
               onClose={toggleForget}
               onForget={_onForget}
             />
           )}
           {isIdentityMainOpen && (
             <IdentityMain
               address={address}
               key='modal-identity-main'
               onClose={toggleIdentityMain}
             />
           )}
           {isIdentitySubOpen && (
             <IdentitySub
               address={address}
               key='modal-identity-sub'
               onClose={toggleIdentitySub}
             />
           )}
           {isPasswordOpen && (
             <ChangePass
               address={address}
               key='modal-change-pass'
               onClose={togglePassword}
             />
           )}
           {isTransferOpen && (
             <Transfer
               key='modal-transfer'
               onClose={toggleTransfer}
               senderId={address}
             />
           )}
           {isProxyOverviewOpen && (
             <ProxyOverview
               key='modal-proxy-overview'
               onClose={toggleProxyOverview}
               previousProxy={proxy}
               proxiedAccount={address}
             />
           )}
           {isMultisigOpen && multiInfos && (
             <MultisigApprove
               address={address}
               key='multisig-approve'
               onClose={toggleMultisig}
               ongoing={multiInfos}
               threshold={meta.threshold as number}
               who={meta.who as string[]}
             />
           )}
           {isRecoverAccountOpen && (
             <RecoverAccount
               address={address}
               key='recover-account'
               onClose={toggleRecoverAccount}
             />
           )}
           {isRecoverSetupOpen && (
             <RecoverSetup
               address={address}
               key='recover-setup'
               onClose={toggleRecoverSetup}
             />
           )}
           {isUndelegateOpen && (
             <UndelegateModal
               accountDelegating={address}
               key='modal-delegate'
               onClose={toggleUndelegate}
             />
           )}
         </td>
         <td />
         <td className='address'>
          {appId}
         </td>
         <td className='address'>
          {docType}
         </td>
         <td className='address'>
          {testValue2}
         </td>
         <td className='number'/>
         <td className='number'>
         {power && (
           <FormatKP
             value={power}
             withSi
           />
         )}
         </td>
         <td />
         <td />
         <td />
         <td />
       </tr>

     );

   }
 }else{
   return (
    <></>
   );

 }

}

export default React.memo(styled(Account)`
  .tags {
    width: 100%;
    min-height: 1.5rem;
  }
`);
