#! /usr/bin/env node
const args = require('yargs').argv;
const validator = require('sway');
const fs = require('fs');
const yaml = require('js-yaml');
const Sway = require('sway')

const options = {errorsOnly : Boolean(args.errorsOnly)};
const filename = args.file;
let definition;

if (!args.file) {
    throw(new Error('Missing \'file\' parameter. '));
}

try {
    definition = yaml.safeLoad(fs.readFileSync(filename, 'utf8'));
} catch (err) {
    throw(err);
}
if (!definition) {
    throw(new Error(g.f('The API file %s is invalid.', filename)));
}

swayValidate(definition, filename).then((res) => printReport(res,options));

function printReport(report,options) {
  let status = 'OK';
  if (report.error.length) {
    status = 'ERROR'
  } else if (report.warning.length) {
    status = 'WARNING'
  }
  console.log('Validation completed for ' + report.path + ': ' + status);
  report.error.forEach((error) => {
    console.log('Error Found at: ' + error.path.join('/') + ' | ' + error.message);
  });
  if (!options.errorsOnly) {
    report.warning.forEach((warning) => {
      console.log('Warning Found at: ' + warning.path.join('/') + ' | ' + warning.message);
    });
  }
}

function swayValidate(definition, filename) {
    // var definitionClone = definition.cloneDeep(definition);

    return Sway.create({ definition: definition }).then(function(api) {
        // api.registerValidator(checkAPIEnforced);
        var swayResponse = api.validate();

        var info = definition.info || {
            version: 'unknown',
            'x-ibm-name': 'unknown-missing-info',
            title: 'unknown-missing-info'
        };
        var name = info['x-ibm-name'] || info.title;
        return {
            title: 'Swagger Version 2.0 schema',
            name: name,
            version: info.version,
            path: filename,
            error: swayResponse.errors,
            warning: swayResponse.warnings,
            type: 'api',
            // status: getErrorStatus(swayResponse.errors)
        };
    });
}
