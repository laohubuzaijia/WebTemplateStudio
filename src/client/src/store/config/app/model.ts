import { ISelected } from "../../../types/selected";
import { CONFIG_TYPEKEYS } from "../../typeKeys";

export interface ISelectProjectTypeAction {
  type: CONFIG_TYPEKEYS.SELECT_WEB_APP;
  payload: ISelected;
}