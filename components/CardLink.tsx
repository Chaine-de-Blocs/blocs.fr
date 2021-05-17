import { classNames } from "../core/css";

import { useServerEffect } from "../core/useContent";

import ogs, { SuccessResult } from "open-graph-scraper";

type Props = {
    href: string;
    defaultTitle: string;
}

interface OGMetaResult extends SuccessResult {
    ogTitle: string;
    ogSiteName: string;
    ogDescription: string;
    ogImage?: {
        url: string;
        width: number;
        height: number;
    };
    requestUrl: string;
}

const parseMeta = async (url: string): Promise<OGMetaResult> => {
    return new Promise((resolve, reject) => {
        ogs({
            url
        }, (err, res) => {
            if (err) {
                reject();
                return;
            }
        
            const meta = res as OGMetaResult;

            resolve(meta);
        });
    });
}

export default (props: Props) => {
    const [ogmeta]: Array<OGMetaResult> =
        useServerEffect(null, "_ogmeta_", async () => parseMeta(props.href));

    if (ogmeta === null) {
        return (
            <a href={props.href} target="_blank">{props.defaultTitle}</a>
        )
    }

    return (
        <div className={classNames('og-card') + ' card-link'} data-card-href={props.href}>
            {
                ogmeta.ogImage &&
                    <div className={classNames('thumbnail')}>
                        <img src={ogmeta.ogImage.url} />
                    </div>
            }
            <div className={classNames('content')}>
                <p className={classNames('title')}>
                    {ogmeta.ogTitle}
                </p>
                <p className={classNames('description')}>
                    {ogmeta.ogDescription}
                </p>
                <p className={classNames('website')}>
                    {ogmeta.requestUrl}
                </p>
            </div>
        </div>
    )
};