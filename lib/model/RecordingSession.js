/*
 * This file is part of the conga-client-profiler module.
 *
 * (c) Anthony Matarazzo <email@anthonymatarazzo.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */

/**
 * @Bass:Document(collection="profiler_client_recording_sessions")
 * @Rest:Resource(type="profiler.model.recording_session")
 */
class RecordingSession {

    constructor() {
        /**
         * @Bass:Id
         * @Bass:Field(type="ObjectID", name="_id")
         * @Rest:ID
         */
        this.id = null;

        /**
         * @Bass:Field(type="String", name="accountId")
         * @Rest:Attribute(update=false)
         */
        this.accountId = null;

        /**
         * @Bass:Field(type="String", name="profilerId")
         * @Rest:Attribute(update=false)
         */
        this.profilerId = null;

        /**
         * @Bass:Field(type="String", name="websiteId")
         * @Rest:Attribute(update=false)
         */
        this.websiteId = null;

        /**
         * @Bass:Field(type="String", name="ipAddress")
         * @Rest:Attribute(update=false)
         */
        this.ipAddress = null;

        /**
         * @Bass:Field(type="String", name="userAgent")
         * @Rest:Attribute(update=false)
         */
        this.userAgent = null;

        /**
         * @Bass:Field(type="Object", name="browser")
         * @Rest:Attribute(update=false)
         */
        this.browser = null;

        /**
         * @Bass:Field(type="String", name="originUrl")
         * @Rest:Attribute(update=false)
         */
        this.originUrl = null;

        /**
         * @Bass:Field(type="String", name="url")
         * @Rest:Attribute(update=false)
         */
        this.url = null;

        /**
         * @Bass:Field(type="Number", name="duration")
         * @Rest:Attribute
         */
        this.duration = 0;

        /**
         * @Bass:Field(type="Number", name="pageCount")
         * @Rest:Attribute
         */
        this.pageCount = 0;

        /**
         * @Bass:Field(type="Boolean", name="hasError")
         * @Rest:Attribute
         */
        this.hasError = false;

        /**
         * @Bass:Field(type="Number", name="bytes")
         * @Rest:Attribute
         */
        this.bytes = 0;

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

module.exports = RecordingSession;