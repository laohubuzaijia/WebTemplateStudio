import classnames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { ReactComponent as HomeSplashSVG } from "./assets/homeSplash.svg";
import { ReactComponent as SummarySplashSVG } from "./assets/summarySplash.svg";

import {
  EXTENSION_COMMANDS,
  ROUTES,
  DEVELOPMENT,
  FRAMEWORK_TYPE
} from "./utils/constants";

import { getVersionsDataAction } from "./store/versions/action";

import appStyles from "./appStyles.module.css";
import { IVersions } from "./types/version";
import { ISelected } from "./types/selected";
import { AppState } from "./store/combineReducers";
import { IOption } from "./types/option";
import { ThunkDispatch } from "redux-thunk";
import RootAction from "./store/ActionType";
import { getPages, getFrameworks, getUserStatus, getTemplateInfo } from "./utils/extensionService/extensionService";
import { parseFrameworksPayload } from "./utils/parseFrameworksPayload";

import Loadable from "react-loadable";
import PageDetails from "./containers/PageDetails";
import { MODAL_TYPES } from "./store/modals/typeKeys";
import RightSidebar from "./containers/RightSidebar";
import TopNavBar from "./components/TopNavBar";
import { setPagesAction } from "./store/selection/pages/action";
import { setValidationsAction } from "./store/config/validations/action";
import { setOutputPathAction } from "./store/selection/app/action";
import { setFrontendFrameworksAction, setBackendFrameworksAction } from "./store/templates/frameworks/action";
import { getPagesOptionsAction } from "./store/templates/pages/action";
import { setPreviewStatusAction } from "./store/templates/preview/action";
import { logIntoAzureActionAction } from "./store/azureProfileData/login/action";
import { AppContext } from "./AppContext";

const PageSelectFrameworks = Loadable({
  loader: () => import(/* webpackChunkName: "PageSelectFrameworks" */  "./containers/PageSelectFrameworks"),
  loading:() => <div/>
});
const PageAddPages = Loadable({
  loader: () => import(/* webpackChunkName: "PageAddPages" */  "./containers/PageAddPages"),
  loading:() => <div/>
});
const PageReviewAndGenerate = Loadable({
  loader: () => import(/* webpackChunkName: "PageReviewAndGenerate" */  "./containers/PageReviewAndGenerate"),
  loading:() => <div/>
});
const PageAzureLogin = Loadable({
  loader: () => import(/* webpackChunkName: "PageAzureLogin" */  "./containers/PageAzureLogin"),
  loading:() => <div/>
});
const GenerationModal = Loadable({
  loader: () => import(/* webpackChunkName: "GenerationModal" */  "./containers/GenerationModal"),
  loading:() => <div/>
});
const CosmosDbModal = Loadable({
  loader: () => import(/* webpackChunkName: "CosmosDbModal" */  "./containers/CosmosDbModal"),
  loading:() => <div/>
});
const AppServiceModal = Loadable({
  loader: () => import(/* webpackChunkName: "AppServiceModal" */  "./containers/AppServiceModal"),
  loading:() => <div/>
});
const ViewLicensesModal = Loadable({
  loader: () => import(/* webpackChunkName: "ViewLicensesModal" */  "./containers/ViewLicensesModal"),
  loading:() => <div/>
});

if (process.env.NODE_ENV === DEVELOPMENT) {
  require("./css/themes.css");
}

interface IDispatchProps {
  updateOutputPath: (outputPath: string) => any;
  logIntoAzure: (azureProfile: AzureProfile) => void;
  setValidationsAction: (validations: any) => void;
  getVersionsData: (versions: IVersions) => any;
  getPages: (pages: IOption[]) => any;
  setPreviewStatus: (isPreview: boolean) => void;
  setPages: (pages: ISelected[]) => void;
  setBackendFrameworks: (frameworks: IOption[]) => any;
  setFrontendFrameworks: (frameworks: IOption[]) => any;
}

interface IStateProps {
  frontendOptions: IOption[];
  selectedFrontend: ISelected;
  selectedBackend: ISelected;
  selectedPages: ISelected[];
  isPreview: boolean;
  modalState: any;
  selectedRoute: string;
}

type Props = IDispatchProps & IStateProps;

const App = (props: Props) => {
  const { selectedFrontend, selectedBackend, selectedPages, setPages, frontendOptions,
    isPreview, setFrontendFrameworks, setBackendFrameworks, modalState, logIntoAzure, selectedRoute } = props;
  const [isLoaded, setIsLoaded] = React.useState(false);
  const promisesLoading: Array<any> = new Array<any>();
  const {vscode} = React.useContext(AppContext);

  const addToPromisesList = (promise: Promise<any>)=>{
    promisesLoading.push(promise);
    return promise;
  }
  const Header = Loadable({
    loader: () => addToPromisesList(import(/* webpackChunkName: "Header" */  "./containers/Header")),
    loading:() => <div/>
  });

  const Footer = Loadable({
    loader: () => addToPromisesList(import(/* webpackChunkName: "Footer" */  "./containers/Footer")),
    loading:() => <div/>
   });
  const PageNewProject = Loadable({
    loader: () => addToPromisesList(import(/* webpackChunkName: "PageNewProject" */ "./containers/PageNewProject")),
    loading:() => <div/>
  });

  if (frontendOptions.length === 0){
    messageEventsFromExtension();
    getFrameworksListAndSetToStore();
  }

  Promise.all(promisesLoading).then(()=>{
    setIsLoaded(true);
  })

  React.useEffect(()=>{
    getUserStatus(vscode).then((event)=>{
      const message = event.data;
      if (message.payload !== null) {
        const azureProfile = message.payload as AzureProfile;
        logIntoAzure(azureProfile);
      }
    });

    getTemplateInfo(vscode).then((event)=>{
      const message = event.data;
      const versionData: IVersions = {
        templatesVersion:message.payload.templatesVersion,
        wizardVersion: message.payload.wizardVersion
      };
      props.getVersionsData(versionData);
      props.setValidationsAction({
        itemNameValidationConfig:message.payload.itemNameValidationConfig,
        projectNameValidationConfig:message.payload.projectNameValidationConfig
      });
      props.setPreviewStatus(message.payload.preview);
    });
  },[vscode]);

  React.useEffect(()=>{
    if (selectedFrontend.internalName!=="" && selectedBackend.internalName!=="") loadPages();
  },[selectedFrontend, selectedBackend]);

  function getFrameworksListAndSetToStore(){
    getFrameworks(vscode, isPreview).then((event: any)=>{
      const message = event.data;
      setFrontendFrameworks(
        parseFrameworksPayload(
          message.payload.frameworks,
          FRAMEWORK_TYPE.FRONTEND,
          message.payload.isPreview
        )
      );
      setBackendFrameworks(
        parseFrameworksPayload(
          message.payload.frameworks,
          FRAMEWORK_TYPE.BACKEND,
          message.payload.isPreview
        )
      );
    });
  }

  const loadPages = () => {
    getPages(vscode, selectedFrontend.internalName, selectedBackend.internalName).then((event)=>{
      props.getPages(event.data.payload.pages);
      selectedPages.map((selectedPage)=>{
        selectedPage.internalName = `wts.Page.${selectedFrontend.internalName}.${selectedPage.defaultName ? selectedPage.defaultName.replace(" ",""):""}`;
      });
      setPages(selectedPages);
    });
  }

  function messageEventsFromExtension(){
    window.addEventListener("message", event => {
      const message = event.data;
      switch (message.command) {
        //only one way
        //from extension to client
        case EXTENSION_COMMANDS.GET_OUTPUT_PATH:
          if (message.payload !== null && message.payload.outputPath !== undefined) {
            props.updateOutputPath(message.payload.outputPath);
          }
          break;
      }
    });
  }

  return (
    <React.Fragment>
      {isLoaded && (<Header />)}
      {isLoaded && (<TopNavBar  />)}

      {isLoaded && (<div className={appStyles.container}>
        {(modalState.modalType === MODAL_TYPES.VIEW_LICENSES_MODAL) && (<ViewLicensesModal/>)}
        {(modalState.modalType === MODAL_TYPES.APP_SERVICE_MODAL) && (<AppServiceModal/>)}
        {(modalState.modalType === MODAL_TYPES.COSMOS_DB_MODAL) && (<CosmosDbModal/>)}
        {(modalState.modalType === MODAL_TYPES.GEN_MODAL) && (<GenerationModal/>)}

        <main
          className={classnames(appStyles.centerView, {
            [appStyles.centerViewNewProjectPage]:
              selectedRoute === ROUTES.NEW_PROJECT,
            [appStyles.centerViewMaxHeight]: selectedRoute === ROUTES.PAGE_DETAILS,
            [appStyles.centerViewAzurePage]: selectedRoute === ROUTES.AZURE_LOGIN
          })}
        >
          {selectedRoute === ROUTES.NEW_PROJECT ? (
            <HomeSplashSVG
             className={classnames(appStyles.splash, appStyles.homeSplash)}
            />
          ) : null}

          {selectedRoute === ROUTES.REVIEW_AND_GENERATE ? (
            <SummarySplashSVG
              className={classnames(
                appStyles.splash,
                appStyles.summarySplash
              )}
            />
          ) : null}

          {(selectedRoute === ROUTES.PAGE_DETAILS) && (<PageDetails />)}
          {(selectedRoute === ROUTES.AZURE_LOGIN) && (<PageAzureLogin/>)}
          {(selectedRoute === ROUTES.REVIEW_AND_GENERATE) && (<PageReviewAndGenerate />)}
          {(selectedRoute === ROUTES.SELECT_FRAMEWORKS) && (<PageSelectFrameworks/>)}

          {(selectedRoute === ROUTES.SELECT_PAGES) && (<PageAddPages isModal={false}/>)}
          {(selectedRoute === ROUTES.NEW_PROJECT) && (<PageNewProject/>)}

        </main>
        <RightSidebar />
      </div>)}
      {isLoaded && (<Footer />)}
      {!isLoaded && (<div className={appStyles.spinnerContainer}></div>)}
    </React.Fragment>
  );
}

const mapDispatchToProps = (
  dispatch: ThunkDispatch<AppState, void, RootAction>
): IDispatchProps => ({
  logIntoAzure: (azureProfile: AzureProfile) => {
    dispatch(logIntoAzureActionAction(azureProfile));
  },
  updateOutputPath: (outputPath: string) => {
    dispatch(setOutputPathAction(outputPath));
  },
  setValidationsAction: (validations: any) => {
    dispatch(setValidationsAction(validations));
  },
  getPages: (pages: IOption[]) => {
    dispatch(getPagesOptionsAction(pages));
  },
  getVersionsData: (versions: IVersions) => {
    dispatch(getVersionsDataAction(versions));
  },
  setPreviewStatus: (isPreview: boolean) => {
    dispatch(setPreviewStatusAction(isPreview));
  },
  setPages: (pages: ISelected[]) => {
    dispatch(setPagesAction(pages));
  },
  setBackendFrameworks: (frameworks: IOption[]) => {
    dispatch(setBackendFrameworksAction(frameworks));
  },
  setFrontendFrameworks: (frameworks: IOption[]) => {
    dispatch(setFrontendFrameworksAction(frameworks));
  }
});

const mapStateToProps = (state: AppState): IStateProps => ({
  selectedFrontend: state.selection.frontendFramework,
  selectedBackend: state.selection.backendFramework,
  frontendOptions: state.templates.frontendOptions,
  selectedPages: state.selection.pages,
  isPreview:  state.config.previewStatus,
  modalState: state.modals.openModal,
  selectedRoute : state.wizardRoutes.selected,
});

export default
  connect(
    mapStateToProps,
    mapDispatchToProps
  )(App);
