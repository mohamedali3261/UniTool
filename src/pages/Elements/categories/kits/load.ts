import { videoKits } from "../../sources/ready/video-pack";
import { readyKits } from "../../sources/ready/kits";
export const load = () => [...readyKits, ...videoKits];
