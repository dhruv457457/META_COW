import { ethers, BrowserProvider, Contract } from "ethers";
import { ERC20_ABI, FACTORY_ADDRESS, FACTORY_ABI } from "./constants";
import { toast } from "react-hot-toast";

/**
 * Improved swap function with better approval handling
 */
export async function swapWithApproval(
  pairAddress: string,
  amountIn: string,
  tokenInAddress: string
): Promise<any> {
  
  if (!window.ethereum) {
    throw new Error("Please install MetaMask");
  }

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  const userAddress = await signer.getAddress();

  // Parse input amount
  const amountInWei = ethers.parseUnits(amountIn, 18);

  // Get token contract
  const tokenIn = new Contract(tokenInAddress, ERC20_ABI, signer);

  console.log("Checking approval...");
  
  // Check current allowance
  let allowance;
  try {
    allowance = await tokenIn.allowance(userAddress, pairAddress);
    console.log("Current allowance:", ethers.formatUnits(allowance, 18));
  } catch (error) {
    console.error("Error checking allowance:", error);
    throw new Error("Failed to check token allowance");
  }

  // If allowance is insufficient, approve
  if (allowance < amountInWei) {
    console.log("Insufficient allowance, approving...");
    
    try {
      // First, try to reset allowance to 0 if it's not already 0
      // Some tokens (like USDT) require this
      if (allowance > 0n) {
        console.log("Resetting approval to 0...");
        const resetTx = await tokenIn.approve(pairAddress, 0n);
        toast.loading("Resetting approval...", { id: "approval" });
        await resetTx.wait();
        console.log("Approval reset successful");
      }

      // Now approve the new amount (use max approval for convenience)
      console.log("Approving tokens...");
      const approveTx = await tokenIn.approve(
        pairAddress, 
        ethers.MaxUint256 // Infinite approval
      );
      
      toast.loading("Approving tokens... Please confirm in wallet", { id: "approval" });
      const approveReceipt = await approveTx.wait();
      toast.success("Tokens approved!", { id: "approval" });
      console.log("Approval successful:", approveReceipt.hash);
      
    } catch (error: any) {
      console.error("Approval error:", error);
      
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Approval cancelled by user");
      }
      
      // Try to get more specific error
      let errorMsg = "Token approval failed";
      if (error.reason) {
        errorMsg = error.reason;
      } else if (error.message) {
        if (error.message.includes("user rejected")) {
          errorMsg = "Approval cancelled";
        } else if (error.message.includes("insufficient funds")) {
          errorMsg = "Insufficient funds for gas";
        } else {
          errorMsg = error.message;
        }
      }
      
      throw new Error(errorMsg);
    }
  } else {
    console.log("Sufficient allowance, skipping approval");
  }

  // Now execute the swap
  console.log("Executing swap...");
  
  try {
    const router = new Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);
    
    // Calculate minimum output (with 1% slippage tolerance)
    const amountOutMin = 0n; // For now, accept any amount (in production, calculate properly)
    
    // Deadline: 20 minutes from now
    const deadline = Math.floor(Date.now() / 1000) + 60 * 20;
    
    // Execute swap
    const swapTx = await router.swapExactTokensForTokens(
      amountInWei,
      amountOutMin,
      [tokenInAddress], // Path (simplified, pair handles the rest)
      userAddress,
      deadline
    );
    
    toast.loading("Swapping... Please wait", { id: "swap" });
    const swapReceipt = await swapTx.wait();
    toast.success("Swap successful!", { id: "swap" });
    console.log("Swap successful:", swapReceipt.hash);
    
    return swapReceipt;
    
  } catch (error: any) {
    console.error("Swap error:", error);
    
    let errorMsg = "Swap failed";
    
    if (error.code === "ACTION_REJECTED") {
      errorMsg = "Swap cancelled by user";
    } else if (error.reason) {
      errorMsg = error.reason;
    } else if (error.message) {
      if (error.message.includes("user rejected")) {
        errorMsg = "Swap cancelled";
      } else if (error.message.includes("insufficient")) {
        errorMsg = "Insufficient liquidity or balance";
      } else if (error.message.includes("slippage")) {
        errorMsg = "Price changed too much, try again";
      } else if (error.message.includes("expired")) {
        errorMsg = "Transaction expired, try again";
      } else {
        errorMsg = error.message;
      }
    }
    
    throw new Error(errorMsg);
  }
}