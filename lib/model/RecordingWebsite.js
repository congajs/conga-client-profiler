/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @Bass:Document(collection="profiler_client_recording_sites")
 * @Rest:Resource(type="profiler.model.recording_site")
 */
class RecordingWebsite {
    constructor() {
        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Bass:OneToOne(document="RecordingAccount", name="accountId")
         * @Rest:Attribute(update=false)
         */
        this.account = null;

        /**
         * @Bass:Field(type="String", name="publicKey")
         * @Rest:Attribute
         * @Assert:NotBlank
         */
        this.publicKey = null;

        /**
         * @Bass:Field(type="String", name="secretKey")
         * @Assert:NotBlank
         * @Rest:Attribute(expose=false)
         */
        this.secretKey = null;

        /**
         * @Bass:Field(type="String", name="host")
         * @Rest:Attribute
         * @Assert:NotBlank
         */
        this.host = null;

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

    /**
     * Get the account roles - need for AuthResource
     * @returns {Array}
     */
    get roles() {
        if (!this.account || !this.account.roles) {
            return [];
        }
        return this.account.roles;
    }
}

module.exports = RecordingWebsite;