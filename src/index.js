'use strict';

const contexts = require('./contexts');

function BrightspaceAuthToken (source) {
	if (!(this instanceof BrightspaceAuthToken)) {
		return new BrightspaceAuthToken(source);
	}

	this._context = null;
	this._scope = null;

	this._source = source;
	this.tenant = source.tenantid;
	this.user = source.sub;
}

BrightspaceAuthToken.prototype.isGlobalContext = function isGlobalContext () {
	// calls getter
	return contexts.Global === this.context;
};

BrightspaceAuthToken.prototype.isTenantContext = function isTenantContext () {
	// calls getter
	return contexts.Tenant === this.context;
};

BrightspaceAuthToken.prototype.isUserContext = function isUserContext () {
	// calls getter
	return contexts.User === this.context;
};

Object.defineProperty(BrightspaceAuthToken.prototype, 'context', {
	get: function () {
		let context = this._context;
		if (null !== context) {
			return context;
		}

		if ('undefined' !== typeof this.user) {
			context = this._context = contexts.User;
		} else if ('undefined' !== typeof this.tenant) {
			context = this._context = contexts.Tenant;
		} else {
			context = this._context = contexts.Global;
		}

		return context;
	}
});

function hasPermissionInResource (resource, permission) {
	return resource.has('*') || resource.has(permission);
}

function hasResourcePermissionInGroup (group, resource, permission) {
	const wild = group.get('*');
	if (!!wild && hasPermissionInResource(wild, permission)) {
		return true;
	}

	const permissions = group.get(resource);
	return !!permissions && hasPermissionInResource(permissions, permission);
}

BrightspaceAuthToken.prototype.hasScope = function hasScope (group, resource, permission) {
	// calls getter
	const scope = this.scope;

	const wild = scope.get('*');
	if (!!wild && hasResourcePermissionInGroup(wild, resource, permission)) {
		return true;
	}

	const resources = scope.get(group);
	return !!resources && hasResourcePermissionInGroup(resources, resource, permission);
};

Object.defineProperty(BrightspaceAuthToken.prototype, 'scope', {
	get: function () {
		let scope = this._scope;
		if (null !== scope) {
			return scope;
		}

		scope = this._scope = new Map();

		const scopeStrings = Array.isArray(this._source.scope)
			? this._source.scope
			: this._source.scope.split(' ');

		for (let scopeString of scopeStrings) {
			const scopeParts = scopeString.split(':');

			const
				group = scopeParts[0],
				resource = scopeParts[1],
				permissions = scopeParts[2].split(',');

			if (!scope.has(group)) {
				scope.set(group, new Map([[
					resource,
					new Set(permissions)
				]]));
				continue;
			}

			const resources = scope.get(group);

			if (!resources.has(resource)) {
				resources.set(resource, new Set(permissions));
				continue;
			}

			const permissionSet = resources.get(resource);
			for (let permission of permissions) {
				permissionSet.add(permission);
			}
		}

		return scope;
	}
});

module.exports = BrightspaceAuthToken;
module.exports.contexts = contexts;
