/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @Bass:Document(collection="profiler_client_recording_accounts")
 * @Rest:Resource(type="profiler.model.recording_account")
 */
class RecordingAccount {

    static get ROLE_CLIENT_PROFILER_ACCOUNT() {
        return 'ROLE_CLIENT_PROFILER_ACCOUNT';
    }

    static get ROLE_CLIENT_PROFILER_API() {
        return 'ROLE_CLIENT_PROFILER_API';
    }

    constructor() {
        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Bass:Field(type="Array", name="roles")
         * @Rest:Attribute
         */
        this.roles = [
            RecordingAccount.ROLE_CLIENT_PROFILER_ACCOUNT,
            RecordingAccount.ROLE_CLIENT_PROFILER_API
        ];

        /**
         * @Bass:Field(type="String", name="email")
         * @Rest:Attribute
         * @Assert:NotBlank
         * @Assert:Regex(pattern="^[^@]+@.+")
         */
        this.email = null;

        /**
         * @Bass:Encrypt
         * @Bass:Field(type="String", name="password")
         * @Assert:NotBlank
         */
        this.password = null;

        /**
         * @Bass:Field(type="String", name="firstName")
         * @Assert:NotBlank
         * @Rest:Attribute
         */
        this.firstName = null;

        /**
         * @Bass:Field(type="String", name="lastName")
         * @Assert:NotBlank
         * @Rest:Attribute
         */
        this.lastName = null;

        /**
         * @Bass:Version
         * @Bass:Field(type="Number", name="version")
         * @Rest:Attribute(update=false)
         */
        this.version = 0;

        /**
         * @Bass:CreatedAt
         * @Bass:Field(type="Date", name="createdAt")
         * @Rest:Attribute(type="Date", format="YYYY-MM-DD HH:mm:ss", update=false)
         */
        this.createdAt = null;

        /**
         * @Bass:UpdatedAt
         * @Bass:Field(type="Date", name="updatedAt")
         * @Rest:Attribute(type="Date", format="YYYY-MM-DD HH:mm:ss", update=false)
         */
        this.updatedAt = null;
    }

}

module.exports = RecordingAccount;