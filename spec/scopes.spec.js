/* global before, describe, it */

'use strict';

const expect = require('chai').expect;

const BrightspaceAuthToken = require('../');

describe('Scopes', function () {
	it('should expose all scopes as $scope', function () {
		const
			scopeStrings = [
				'https://api.brightspace.com/auth/valence:apps:manage,update',
				'https://api.brightspace.com/auth/*:*:read',
				'https://api.brightspace.com/auth/foo:*:delete',
				'https://api.brightspace.com/auth/foo:bar:*'
			],
			token = new BrightspaceAuthToken({
				scope: scopeStrings.join(' ')
			});

		expect(token.scope).to.be.an.instanceof(Map);
		expect(token.scope.get('valence')).to.be.an.instanceof(Map);
		expect(token.scope.get('valence').get('apps')).to.be.an.instanceof(Set);
		expect(token.scope.get('valence').get('apps').has('manage')).to.be.true;
		expect(token.scope.get('valence').get('apps').has('update')).to.be.true;
		expect(token.scope.get('foo')).to.be.an.instanceof(Map);
		expect(token.scope.get('foo').get('*')).to.be.an.instanceof(Set);
		expect(token.scope.get('foo').get('*').has('delete')).to.be.true;
		expect(token.scope.get('foo').get('bar')).to.be.an.instanceof(Set);
		expect(token.scope.get('foo').get('bar').has('*')).to.be.true;
		expect(token.scope.get('*')).to.be.an.instanceof(Map);
		expect(token.scope.get('*').get('*')).to.be.an.instanceof(Set);
		expect(token.scope.get('*').get('*').has('read')).to.be.true;
	});

	describe('#hasScope', function () {
		let token;
		before(function () {
			const scopeStrings = [
				'https://api.brightspace.com/auth/valence:apps:manage,update',
				'https://api.brightspace.com/auth/*:*:read',
				'https://api.brightspace.com/auth/foo:*:delete',
				'https://api.brightspace.com/auth/foo:bar:*'
			];

			token = new BrightspaceAuthToken({
				scope: scopeStrings.join(' ')
			});
		});

		it('should match explicitly', function () {
			expect(token.hasScope('valence', 'apps', 'manage')).to.be.true;
			expect(token.hasScope('valence', 'apps', 'update')).to.be.true;
			expect(token.hasScope('valence', 'apps', 'rawr')).to.be.false;
		});

		it('should respect wildcards', function () {
			expect(token.hasScope('valence', 'apps', 'read')).to.be.true;
			expect(token.hasScope('chuckle', 'bunny', 'read')).to.be.true;
			expect(token.hasScope('chuckle', 'bunny', 'rawr')).to.be.false;
			expect(token.hasScope('foo', 'quux', 'delete')).to.be.true;
			expect(token.hasScope('foo', 'quux', 'read')).to.be.true;
			expect(token.hasScope('foo', 'quux', 'rawr')).to.be.false;
			expect(token.hasScope('foo', 'bar', 'delete')).to.be.true;
			expect(token.hasScope('foo', 'bar', 'read')).to.be.true;
			expect(token.hasScope('foo', 'bar', 'rawr')).to.be.true;
		});
	});
});
