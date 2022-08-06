import { BigNumber } from "ethers"; 
import   { ethers } from "hardhat"; 


export const HOUR = 3600;
export const DAY = 24 * HOUR;
 
export function toBigNumber(number: Number): BigNumber {
    return BigNumber.from(number)
}

export async function simulateTimeTravel(timeInSeconds: number) {
    await ethers.provider.send("evm_increaseTime", [timeInSeconds]);
    await ethers.provider.send("evm_mine", []);
}
