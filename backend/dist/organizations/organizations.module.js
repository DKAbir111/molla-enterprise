"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationsModule = void 0;
const tslib_1 = require("tslib");
const common_1 = require("@nestjs/common");
const organizations_service_1 = require("./organizations.service");
const organizations_controller_1 = require("./organizations.controller");
let OrganizationsModule = class OrganizationsModule {
};
exports.OrganizationsModule = OrganizationsModule;
exports.OrganizationsModule = OrganizationsModule = tslib_1.__decorate([
    (0, common_1.Module)({
        controllers: [organizations_controller_1.OrganizationsController],
        providers: [organizations_service_1.OrganizationsService],
    })
], OrganizationsModule);
