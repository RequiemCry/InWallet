import { ArrowUpFromDot } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ethers } from 'ethers';
import { env } from '@/config/environment';
import { useAddress } from '@/app/address-context';

function getRandomAmount(min: number, max: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((Math.random() * (max - min) + min) * factor) / factor;
}

const networks = {
  opSepolia: {
    url: `https://optimism-sepolia.infura.io/v3/${env.NEXT_PUBLIC_INFURA_API_KEY}`,
    amount: ethers.utils.parseUnits(getRandomAmount(0.0015, 0.0045, 4).toString(), 'ether')
  },
  baseSepolia: {
    url: `https://rpc.ankr.com/base_sepolia/${env.NEXT_PUBLIC_ANKR_API_KEY}`,
    amount: ethers.utils.parseUnits(getRandomAmount(0.0015, 0.0045, 4).toString(), 'ether')
  },
  avaxFuji: {
    url: `https://avalanche-fuji.infura.io/v3/${env.NEXT_PUBLIC_INFURA_API_KEY}`,
    amount: ethers.utils.parseUnits(getRandomAmount(0.07, 0.17, 2).toString(), 'ether')
  }
};

async function sendTestFunds(network: { url: any; amount: any; }, recipient: string) {
  try {
    const provider = new ethers.providers.JsonRpcProvider(network.url);
    const wallet = new ethers.Wallet(env.NEXT_PUBLIC_PRIVATE_KEY, provider);

    const tx = await wallet.sendTransaction({
      to: recipient,
      value: network.amount
    });

    await tx.wait();
  } catch (error) {
    console.error('Error sending transaction:', error);
  }
}

export const SendWidgetAction = () => {
  const { address } = useAddress();

  const handleSend = async () => {
    if (!address) {
      toast.error('Recipient address is not resolved yet.');
      return;
    }

    setTimeout(() => {
      toast.success('Test funds sent successfully');
    }, 1000);

    sendTestFunds(networks.opSepolia, address);
    sendTestFunds(networks.baseSepolia, address);
    sendTestFunds(networks.avaxFuji, address);
  };

  return (
    <Button
      type="button"
      onClick={handleSend}
      variant="brand"
      className="ring-offset-gray-900"
    >
      <ArrowUpFromDot size={16} className="mr-2" />
      Send
    </Button>
  );
};
