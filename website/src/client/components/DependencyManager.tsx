import { StyleSheet, css } from 'aphrodite';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import * as React from 'react';
import { SnackMissingDependencies } from 'snack-sdk';

import {
  SnackCodeFile,
  SnackFile,
  SnackFiles,
  SnackDependencies,
  SnackDependency,
  Annotation,
  AnnotationAction,
  SDKVersion,
} from '../types';
import {
  getPackageJsonFromDependencies,
  getDependencyAnnotations,
  getPackageJsonDependencies,
} from '../utils/dependencies';
import { openEmbeddedSessionFullScreen } from '../utils/embeddedSession';
import { isScript, isPackageJson } from '../utils/fileUtilities';
import type { FileDependencies } from '../utils/findDependencies';
import { EditorViewProps } from './EditorViewProps';
import Toast from './shared/Toast';

type State = {
  files: SnackFiles;
  dependencies: SnackDependencies;
  missingDependencies: SnackMissingDependencies;
  sdkVersion: SDKVersion;
  selectedFile: string;
  packageJson: SnackCodeFile;
  annotations: Annotation[];
  uncheckedFiles: Set<string>; // files that are yet to be checked
  filesDependencies: { [path: string]: FileDependencies }; // map of all files and their dependencies
  getDependencyAction: (
    name: string,
    version: string,
    dependencies: SnackDependencies,
    sdkVersion: SDKVersion
  ) => AnnotationAction;
};

export function withDependencyManager<Props extends EditorViewProps>(
  WrappedComponent: React.ComponentType<Props>,
  isEmbedded?: boolean
) {
  return class DependencyManager extends React.Component<Props, State> {
    constructor(props: Props) {
      super(props);
      const packageJson = getPackageJsonFromDependencies(props.dependencies);
      this.state = {
        files: {},
        dependencies: props.dependencies,
        missingDependencies: props.missingDependencies,
        sdkVersion: props.sdkVersion,
        packageJson,
        selectedFile: props.selectedFile,
        annotations: getDependencyAnnotations(
          packageJson,
          props.dependencies,
          props.missingDependencies,
          props.files,
          {},
          props.sdkVersion,
          this.getDependencyAction
        ),
        uncheckedFiles: new Set(),
        filesDependencies: {},
        getDependencyAction: this.getDependencyAction,
      };
    }

    static getDerivedStateFromProps(props: Props, state: State) {
      const { sdkVersion, files, dependencies, missingDependencies, selectedFile } = props;
      let { packageJson } = state;

      // Detect changed files and add them to a collection for
      // checking them after a debounced timeout.
      let uncheckedFiles: Set<string> | undefined;
      if (files !== state.files) {
        uncheckedFiles = new Set(state.uncheckedFiles);
        for (const path in files) {
          const file = files[path];
          if (
            file.type === 'CODE' &&
            isScript(path) &&
            file.contents !== state.files[path]?.contents
          ) {
            uncheckedFiles.add(path);
          }
        }
        for (const path in state.files) {
          if (!files[path]) {
            uncheckedFiles.add(path);
          }
        }
      }

      if (
        !isPackageJson(selectedFile) ||
        isEqual(packageJson, getPackageJsonFromDependencies(state.dependencies))
      ) {
        const newPackageJson = getPackageJsonFromDependencies(dependencies);
        packageJson = isEqual(newPackageJson, packageJson) ? packageJson : newPackageJson;
      }

      return uncheckedFiles ||
        files !== state.files ||
        dependencies !== state.dependencies ||
        missingDependencies !== state.missingDependencies ||
        sdkVersion !== state.sdkVersion ||
        packageJson !== state.packageJson ||
        selectedFile !== state.selectedFile
        ? {
            files,
            dependencies,
            missingDependencies,
            sdkVersion,
            packageJson,
            selectedFile,
            annotations:
              dependencies !== state.dependencies ||
              missingDependencies !== state.missingDependencies ||
              sdkVersion !== state.sdkVersion
                ? getDependencyAnnotations(
                    packageJson,
                    dependencies,
                    missingDependencies,
                    files,
                    state.filesDependencies,
                    sdkVersion,
                    state.getDependencyAction
                  )
                : state.annotations,
            uncheckedFiles: uncheckedFiles ?? state.uncheckedFiles,
          }
        : null;
    }

    componentDidMount() {
      this.checkForMissingDependencies();
    }

    componentDidUpdate(_prevProps: Props, prevState: State) {
      if (
        prevState.uncheckedFiles !== this.state.uncheckedFiles &&
        this.state.uncheckedFiles.size
      ) {
        this.checkForMissingDependencies();
      }
    }

    /**
     * Intercept any edits to package.json and debounce updates
     * to the dependencies.
     */
    private updateFiles = (
      updateFn: (files: SnackFiles) => { [path: string]: SnackFile | null }
    ) => {
      this.props.updateFiles((files) => {
        const filesUpdate = updateFn(files);
        const packageJson: SnackCodeFile = filesUpdate['package.json'] as any;
        if (packageJson) {
          delete filesUpdate['package.json'];
          this.setState(
            (st) => ({
              packageJson,
              annotations: getDependencyAnnotations(
                packageJson,
                st.dependencies,
                st.missingDependencies,
                st.files,
                st.filesDependencies,
                st.sdkVersion,
                st.getDependencyAction
              ),
            }),
            this.updateDependenciesFromPackageJson
          );
        }
        return filesUpdate;
      });
    };

    /**
     * Propagate any edits to package.json to the session dependencies.
     * If package.json is not valid, no updates are propagated.
     */
    private updateDependenciesFromPackageJson = debounce(() => {
      const packageDeps = getPackageJsonDependencies(this.state.packageJson, this.state.sdkVersion);
      if (packageDeps) {
        this.props.updateDependencies((sessionDeps) => {
          const update: { [name: string]: SnackDependency | null } = {};

          // Add / update dependencies
          for (const name in packageDeps) {
            const version = packageDeps[name];
            const sessionDep = sessionDeps[name];
            if (sessionDep?.version !== version) {
              update[name] = {
                version,
              };
            }
          }

          // Remove dependencies
          for (const name in sessionDeps) {
            if (!packageDeps[name]) {
              update[name] = null;
            }
          }
          return update;
        });
      }
    }, 1000);

    /**
     * Intercept any updates to dependencies and edit package.json accordingly.
     */
    private updateDependencies = (
      updateFn: (dependencies: SnackDependencies) => { [name: string]: SnackDependency | null }
    ) => {
      // @ts-ignore
      const dependencies: SnackDependencies = this.props.updateDependencies(updateFn);
      const packageJson = getPackageJsonFromDependencies(dependencies);
      this.setState(() => ({
        packageJson,
      }));
    };

    /**
     * Checks for missing dependencies in the files that were edited.
     */
    private checkForMissingDependencies = debounce(async () => {
      const { default: findDependencies } = await import('../utils/findDependencies');

      // Find all dependencies for all changed files
      const { files, uncheckedFiles } = this.state;
      let { filesDependencies } = this.state;
      let newFilesDep: { [path: string]: FileDependencies } | undefined;
      for (const path of uncheckedFiles) {
        const file: SnackCodeFile = files[path] as any;
        if (!file) {
          if (this.state.filesDependencies[path]) {
            newFilesDep = newFilesDep ?? { ...filesDependencies };
            delete newFilesDep[path];
          }
        } else {
          try {
            const fileDependencies = findDependencies(file.contents, path);
            if (!isEqual(fileDependencies, this.state.filesDependencies[path])) {
              newFilesDep = newFilesDep ?? { ...filesDependencies };
              newFilesDep[path] = fileDependencies;
            }
          } catch (e) {
            // babel could not compile this file, ignore
          }
        }
      }
      filesDependencies = newFilesDep ?? filesDependencies;

      // Update state
      this.setState((state) => ({
        uncheckedFiles: new Set<string>(),
        filesDependencies,
        annotations: newFilesDep
          ? getDependencyAnnotations(
              state.packageJson,
              state.dependencies,
              state.missingDependencies,
              state.files,
              filesDependencies,
              state.sdkVersion,
              state.getDependencyAction
            )
          : state.annotations,
      }));
    }, 1000);

    private getDependencyAction = (
      name: string,
      version: string,
      dependencies: SnackDependencies,
      _sdkVersion: SDKVersion
    ): AnnotationAction => {
      if (isEmbedded) {
        return {
          title: 'Open full editor to add dependencies',
          run: this.handleOpenFullEditor,
        };
      } else if (dependencies[name]) {
        if (dependencies[name].wantedVersion && dependencies[name].wantedVersion !== version) {
          return {
            title: `Update to ${dependencies[name].wantedVersion}`,
            icon: () => (
              <svg className={css(styles.icon)} viewBox="0 0 16 16">
                <path d="M2,5.09257608 L7.47329684,8.31213064 L7.47329684,14.7092088 L2,11.5325867 L2,5.09257608 Z M2.49245524,4.22207437 L7.97432798,1 L13.506361,4.2238509 L7.92838937,7.41965108 L2.49245524,4.22207437 Z M14,5.09352708 L14,11.5325867 L8.47329684,14.7128733 L8.47329684,8.25995389 L14,5.09352708 Z" />
              </svg>
            ),
            run: () =>
              this.updateDependencies(() => ({
                [name]: { version: dependencies[name].wantedVersion as string },
              })),
          };
        } else {
          return {
            title: 'Remove dependency',
            run: () =>
              this.updateDependencies(() => ({
                [name]: null,
              })),
          };
        }
      } else {
        return {
          title: 'Add dependency',
          icon: () => (
            <svg className={css(styles.icon)} viewBox="0 0 16 16">
              <path d="M2,5.09257608 L7.47329684,8.31213064 L7.47329684,14.7092088 L2,11.5325867 L2,5.09257608 Z M2.49245524,4.22207437 L7.97432798,1 L13.506361,4.2238509 L7.92838937,7.41965108 L2.49245524,4.22207437 Z M14,5.09352708 L14,11.5325867 L8.47329684,14.7128733 L8.47329684,8.25995389 L14,5.09352708 Z" />
            </svg>
          ),
          run: () =>
            this.updateDependencies(() => ({
              [name]: { version },
            })),
        };
      }
    };

    private handleOpenFullEditor = () => {
      openEmbeddedSessionFullScreen(this.props);
    };

    render() {
      const { selectedFile } = this.props;
      const { packageJson, annotations } = this.state;
      const hasEmbeddedMissingDependencies = isEmbedded
        ? annotations.some(
            ({ location, action, severity }) =>
              location?.fileName === selectedFile &&
              !!action &&
              selectedFile !== 'package.json' &&
              severity > 2
          )
        : false;

      return (
        <>
          <WrappedComponent
            {...this.props}
            files={{ ...this.props.files, 'package.json': packageJson }}
            updateFiles={this.updateFiles}
            updateDependencies={this.updateDependencies}
            annotations={[...annotations, ...this.props.annotations]}
          />
          <div>
            {hasEmbeddedMissingDependencies && (
              <Toast
                label={<span>Open full editor to add new dependencies</span>}
                actions={[
                  {
                    label: `Open`,
                    action: this.handleOpenFullEditor,
                  },
                ]}
              />
            )}
          </div>
        </>
      );
    }
  };
}

const styles = StyleSheet.create({
  icon: {
    height: 16,
    width: 16,
    fill: 'currentColor',
    verticalAlign: 'middle',
    opacity: 0.7,
  },
});
