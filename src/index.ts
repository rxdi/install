#!/usr/bin/env node

import { FileService } from '@rxdi/core/services/file';
import { Container } from '@rxdi/core/container/Container';
import { ExternalImporter, ExternalImporterIpfsConfig } from '@rxdi/core/services/external-importer';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

const fileService = Container.get(FileService);
const dependencies: ExternalImporterIpfsConfig[] = [];
let ipfsProvider = '';
let hash = '';

export interface PackagesConfig {
    dependencies: string[];
    ipfsProvider: string;
}

export const loadDeps = (currentPackage: PackagesConfig, dependencies: ExternalImporterIpfsConfig[]) => {
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

export const DownloadDependencies = (dependencies: ExternalImporterIpfsConfig[]): Observable<any> => {
    return Container.get(ExternalImporter).downloadIpfsModules(dependencies);
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
    loadDeps({ ipfsProvider: ipfsProvider, dependencies: [hash] }, dependencies);
}

if (!hash && fileService.isPresent(`${process.cwd() + `/${process.argv[3]}`}`)) {
    const customJson: PackagesConfig = require(`${process.cwd() + `/${process.argv[3]}`}`);
    loadDeps(customJson, dependencies);
}

if (!hash && fileService.isPresent(`${process.cwd() + '/package.json'}`)) {
    const ipfsConfig: PackagesConfig = require(`${process.cwd() + '/package.json'}`).ipfs;
    if (ipfsConfig) {
        loadDeps(ipfsConfig, dependencies);
    }
}

if (!hash && fileService.isPresent(`${process.cwd() + '/.rxdi.json'}`)) {
    const rxdiJson: PackagesConfig = require(`${process.cwd() + '/.rxdi.json'}`);
    loadDeps(rxdiJson, dependencies);
}

DownloadDependencies(dependencies)
    .pipe(take(1))
    .subscribe(
        () => console.log(JSON.stringify(dependencies, null, 2), '\nModules installed!'),
        (e) => console.error(e)
    );