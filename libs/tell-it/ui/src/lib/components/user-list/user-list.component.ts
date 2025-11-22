import { ChangeDetectionStrategy, Component, input } from "@angular/core";
import { NgIcon } from "@ng-icons/core";
import { UserOverview } from "@tell-it/domain";

@Component({
    selector: "tell-it-app-user-list",
    imports: [NgIcon],
    template: ` <ul>
        @for (_user of users(); track _user.id) {
            <li>
                @if (_user.disconnected) {
                    <ng-icon name="bootstrapExclamationTriangle" title="Disconnected" />
                }

                <span [class.username]="_user.id === user()?.id">{{ _user.name }}</span>
                @if (showQueue()) {
                    - {{ _user.queuedStories }}
                }
            </li>
        }
    </ul>`,
    styles: `
        :host {
            display: contents;
        }

        ul {
            list-style: none;
            padding: 0;
        }

        li {
            .username {
                color: #daa420;
            }
        }
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TellItUserListComponent {
    users = input<UserOverview[] | null>();
    user = input<UserOverview | null>();
    showQueue = input<boolean>(false);
}
