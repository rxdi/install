#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const file_1 = require("@rxdi/core/services/file");
const Container_1 = require("@rxdi/core/container/Container");
const external_importer_1 = require("@rxdi/core/services/external-importer");
const operators_1 = require("rxjs/operators");
const fileService = Container_1.Container.get(file_1.FileService);
const dependencies = [];
let ipfsProvider = '';
let hash = '';
exports.loadDeps = (currentPackage, dependencies) => {
    if (!currentPackage) {
        throw new Error('Missing ipfs config!');
    }
    if (!currentPackage.ipfsProvider) {
        throw new Error('Missing ipfsProvider package.json');
    }
    const ipfsProvider = currentPackage.ipfsProvider;
    if (currentPackage.dependencies) {
        currentPackage.dependencies.map(hash => dependencies.push({ hash, ipfsProvider }));
    }
};
exports.DownloadDependencies = (dependencies) => {
    return Container_1.Container.get(external_importer_1.ExternalImporter).downloadIpfsModules(dependencies);
};
process.argv.forEach(function (val, index, array) {
    if (index === 3 && val.includes('--hash=')) {
        hash = val.split('--hash=')[1];
    }
    if (index === 4 && val.includes('--provider=')) {
        ipfsProvider = val.split('--provider=')[1];
    }
});
if (hash) {
    exports.loadDeps({ ipfsProvider: ipfsProvider, dependencies: [hash] }, dependencies);
}
if (!hash && fileService.isPresent(`${process.cwd() + `/${process.argv[3]}`}`)) {
    const customJson = require(`${process.cwd() + `/${process.argv[3]}`}`);
    exports.loadDeps(customJson, dependencies);
}
if (!hash && fileService.isPresent(`${process.cwd() + '/package.json'}`)) {
    const ipfsConfig = require(`${process.cwd() + '/package.json'}`).ipfs;
    if (ipfsConfig) {
        exports.loadDeps(ipfsConfig, dependencies);
    }
}
if (!hash && fileService.isPresent(`${process.cwd() + '/.rxdi.json'}`)) {
    const rxdiJson = require(`${process.cwd() + '/.rxdi.json'}`);
    exports.loadDeps(rxdiJson, dependencies);
}
exports.DownloadDependencies(dependencies)
    .pipe(operators_1.take(1))
    .subscribe(() => console.log(JSON.stringify(dependencies, null, 2), '\nModules installed!'), (e) => console.error(e));
