import { FC, useEffect } from 'react'
import { Link } from 'lucide-react';

import { publicResolverCcipAbi, publicResolverCcipAddress } from '@/wagmi.generated'
import { BookUser, Coins } from 'lucide-react'
import { Chain, namehash, zeroAddress } from 'viem'
import { avalancheFuji } from 'viem/chains'
import { useReadContract } from 'wagmi'

import { DomainContext } from '@/app/atoms'
import ChainIcon from '@/components/chain-icon'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Separator } from '@/components/ui/separator'
import { useChainlinkPriceFeeds } from '@/hooks/use-chainlink-price-feeds'
import { convertEVMChainIdToCoinType } from '@/utils/coin-type'
import { copyToClipboard } from '@/utils/copy-to-clipboard'

import { useDomainMultichainBalances } from '../_hooks/use-domain-multichain-balances'
import { useAddress } from '@/app/address-context';

interface ChainDetailsHoverCardProps {
  chain: Chain
  domainContext: DomainContext
}
export const ChainDetailsHoverCard: FC<ChainDetailsHoverCardProps> = (props) => {
  return (
    <HoverCard openDelay={0} closeDelay={50}>
      <HoverCardTrigger>
        <button
          type="button"
          className="flex rounded-full outline-none ring-offset-background transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <ChainIcon chain={props.chain} />
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-[22.2rem] max-w-full overflow-hidden" sideOffset={12}>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-center gap-2">
            <ChainIcon size={32} chain={props.chain} />
            <h4 className="font-semibold leading-none">{props.chain.name}</h4>
          </div>
          <div className="flex flex-col gap-3 rounded-sm border bg-muted p-2 pb-3">
            <DomainChainResolvedAddress {...props} />
            <Separator className="-mx-2 w-auto" />
            <DomainChainFetchedBalance {...props} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-center text-xs text-muted-foreground">
              Resolved smart wallet address via ENSIP-11 ⚡
            </div>
            <div className="text-center text-xs text-muted-foreground">
              Converted to USD using Chainlink Data Feeds 🤖
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

const DomainChainResolvedAddress: FC<ChainDetailsHoverCardProps> = ({ chain, domainContext }) => {
  const { address, setAddress } = useAddress(); // Используйте контекст здесь
  const { domain } = domainContext;
  const query = useReadContract({
    chainId: avalancheFuji.id,
    address: publicResolverCcipAddress[avalancheFuji.id],
    abi: publicResolverCcipAbi,
    functionName: 'addr',
    args: [namehash(domain), BigInt(convertEVMChainIdToCoinType(chain.id))],
  });

  useEffect(() => {
    if (query.data) {
      setAddress(query.data);
    }
  }, [query.data, setAddress]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5">
        <BookUser size={14} />
        <h5 className="text-sm font-medium">Resolved Address</h5>
        <Button size="xs" className="ml-auto" onClick={() => copyToClipboard(query.data)}>
          Copy
        </Button>
      </div>
      <div className="h-[13.5px] font-mono text-xs text-muted-foreground">
        {!query.isLoading && (
          <span className="animate-in fade-in-0">{query.data || zeroAddress}</span>
        )}
      </div>
    </div>
  );
};

const DomainChainFetchedBalance: FC<ChainDetailsHoverCardProps> = ({ chain, domainContext }) => {
  const { address } = useAddress();
  const balances = useDomainMultichainBalances(domainContext, [chain], false);
  const balancesWithPrices = useChainlinkPriceFeeds(balances || []);

  const getExplorerUrl = (chain: number, address: string | undefined) => {
    switch (chain) {
      case 43113:
        return `https://testnet.snowtrace.io/address/${address}`;
      case 84532:
        return `https://base-sepolia.blockscout.com/address/${address}`;
      case 11155420:
        return `https://optimism-sepolia.blockscout.com/address/${address}`;
    }
  };

  const explorerUrl = getExplorerUrl(chain.id, address);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Coins size={14} />
          <h5 className="text-sm font-medium">Fetched Balance</h5>
        </div>
        <button
          onClick={() => window.open(explorerUrl, '_blank')}
          className="flex items-center justify-center p-2 rounded hover:bg-gray-200"
          aria-label="Open in Explorer"
        >
          <Link size={14} />
        </button>
      </div>
      <div className="h-[13.5px] font-mono text-xs text-muted-foreground">
        {!!balances?.length && (
          <span className="animate-in fade-in-0">
            {balances[0].formatted || '0'} {balances[0].symbol}
          </span>
        )}
        {!!balances?.length &&
          !balancesWithPrices.isLoading &&
          !!balancesWithPrices.data?.totalFormattedInUSD && (
            <span className="animate-in fade-in-0">
              {' '}
              ({balancesWithPrices.data.totalFormattedInUSD} $)
            </span>
          )}
      </div>
    </div>
  );
};